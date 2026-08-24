import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type ClientTokenPayload = {
  id: string;
  role: string;
};

export function verifyClient(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as ClientTokenPayload;

    if (decoded.role !== "client") {
      res.status(403).json({ success: false, message: "Client access required" });
      return;
    }

    // Kept off req.body (unlike verifyAdmin) so a multipart form field can't
    // spoof it once multer parses the request body downstream.
    res.locals.clientId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
