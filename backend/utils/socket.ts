import type { Server as HttpServer } from "http";
import { isValidObjectId } from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Only ever called from inside the "location:subscribe" handler below (at
// connection/event time, never at module-evaluation time), so this is safe
// despite complaint.model.ts importing getIO from this same file — by the
// time either side's function body actually runs, both modules have long
// since finished loading.
import { Complaint } from "../model/complaint.model";

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true },
  });

  // Same admin/rider/client checks as middleware/verifyAdmin.ts,
  // verifyRider.ts and verifyClient.ts, adapted for the socket handshake
  // (token comes from `auth`, not an Authorization header).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing or invalid authorization"));
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; role: string };
      if (decoded.role !== "admin" && decoded.role !== "rider" && decoded.role !== "client") {
        next(new Error("Admin, rider, or client access required"));
        return;
      }
      socket.data.role = decoded.role;
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // Riders each get their own room (keyed by their id) so a job assignment
  // can be pushed to exactly the rider it was assigned to.
  io.on("connection", (socket) => {
    if (socket.data.role === "rider") {
      socket.join(socket.data.userId as string);
    }

    // Lets an admin or client watch one rider's live position — a room
    // separate from the rider's own id-room above, so a rider never
    // receives its own location fix echoed back to it.
    socket.on("location:subscribe", async (payload: { riderId?: string; complaintId?: number }) => {
      let room: string | null = null;

      if (socket.data.role === "admin" && payload?.riderId && isValidObjectId(payload.riderId)) {
        room = `location:${payload.riderId}`;
      } else if (socket.data.role === "client" && payload?.complaintId !== undefined) {
        // Reuse the exact same ownership check the REST tracking endpoint
        // already uses — never trust a client-supplied riderId directly.
        const tracking = await Complaint.getTrackingForClient(payload.complaintId, socket.data.userId as string);
        if (tracking?.rider) room = `location:${tracking.rider._id}`;
      }

      if (!room) return;

      if (socket.data.locationRoom) socket.leave(socket.data.locationRoom as string);
      socket.join(room);
      socket.data.locationRoom = room;
    });

    socket.on("location:unsubscribe", () => {
      if (socket.data.locationRoom) {
        socket.leave(socket.data.locationRoom as string);
        socket.data.locationRoom = undefined;
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
