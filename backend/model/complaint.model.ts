import { isValidObjectId, Types, type FilterQuery } from "mongoose";

import { Client } from "../schemas/client.schema";
import {
  Complaint as ComplaintSchema,
  type ComplaintDocument,
  type ComplaintStatus,
} from "../schemas/complaint.schema";
import { sendPushNotification } from "../middleware/pushNotifications";
import { Rider } from "../schemas/rider.schema";
import { RiderAssignment } from "../schemas/riderAssignment.schema";
import { RiderLocation } from "../schemas/riderLocation.schema";
import type { CreateComplaintInput, UpdateComplaintInput } from "../schemas/complaint.zod";

export type UpdateComplaintResult =
  | { outcome: "not-found" }
  | { outcome: "rider-not-found" }
  | { outcome: "too-many-unpaid"; unpaidCount: number }
  | { outcome: "unpaid-balance" }
  | { outcome: "ok"; complaint: NonNullable<Awaited<ReturnType<typeof Complaint.getComplaintById>>> };

export type RiderJobActionResult =
  | { outcome: "not-found" }
  | { outcome: "forbidden" }
  | { outcome: "invalid-transition" }
  | { outcome: "ok"; complaint: NonNullable<Awaited<ReturnType<typeof Complaint.getComplaintById>>> };

// Rider-driven progression: tapping "Start Now" moves Assigned -> On The Way,
// "Mark Arrived" moves On The Way -> Arrived. One step per call — the server
// (not the rider) decides the next status from whatever it's currently at.
const RIDER_STAGE_ADVANCE: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  Assigned: "On The Way",
  "On The Way": "Arrived",
};

// Matches PAGE_SIZE_TABLE in webFrontend/src/data/constants.ts
const COMPLAINTS_PAGE_SIZE = 8;

// Matches the mobile app's "load more" page size in Frontendui/src/screens/HistoryScreen.tsx
const CLIENT_COMPLAINTS_PAGE_SIZE = 10;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Sum of amountDue still owed on this client's OTHER unpaid complaints — carried
// forward onto whichever complaint the admin is currently billing, so settling
// "the total" clears the client's whole outstanding balance, not just one job.
async function getCarriedOverDue(clientId: string, excludeComplaintId: number): Promise<number> {
  const result = await ComplaintSchema.aggregate([
    {
      $match: {
        clientId: new Types.ObjectId(clientId),
        _id: { $ne: excludeComplaintId },
        amountDue: { $gt: 0 },
        paymentStatus: "Unpaid",
      },
    },
    { $group: { _id: null, total: { $sum: "$amountDue" } } },
  ]);
  return result[0]?.total ?? 0;
}

// Count of this client's OTHER complaints that currently represent unresolved
// debt — amountDue > 0, still Unpaid, and not yet Resolved. Used to cap a
// client at 2 simultaneously open unpaid charges before a 3rd can be billed.
async function countOtherUnpaidComplaints(clientId: string, excludeComplaintId: number): Promise<number> {
  return ComplaintSchema.countDocuments({
    clientId: new Types.ObjectId(clientId),
    _id: { $ne: excludeComplaintId },
    amountDue: { $gt: 0 },
    paymentStatus: "Unpaid",
    status: { $ne: "Resolved" },
  });
}

type ListComplaintsOptions = {
  search?: string;
  bucket?: "pending" | "completed";
  riderId?: string;
  clientId?: string;
  // Calendar day (UTC) the complaint was raised on, "YYYY-MM-DD".
  date?: string;
  // Billable complaints only (amountDue > 0) at this payment status.
  paymentStatus?: "Paid" | "Unpaid";
};

export class Complaint {
  // A client can't have more than 2 complaints open (not yet Resolved) at
  // once — used to cap raising a new one until an earlier one is closed.
  static async countActiveComplaints(clientId: string): Promise<number> {
    return ComplaintSchema.countDocuments({ clientId, status: { $ne: "Resolved" } });
  }

  // The client's TRUE total outstanding balance right now — summed live
  // across every one of their complaints, not just whichever one happens to
  // be "active". A single complaint's own totalAmount only folds in the rest
  // of the client's debt at the moment IT was priced, so it goes stale/wrong
  // the instant a newer, not-yet-priced complaint becomes the active one.
  static async getOutstandingBalanceForClient(clientId: string): Promise<number> {
    const result = await ComplaintSchema.aggregate([
      {
        $match: {
          clientId: new Types.ObjectId(clientId),
          amountDue: { $gt: 0 },
          paymentStatus: "Unpaid",
        },
      },
      { $group: { _id: null, total: { $sum: "$amountDue" } } },
    ]);
    return result[0]?.total ?? 0;
  }

  static async createComplaint(clientId: string, input: CreateComplaintInput, photos: string[]) {
    const clientExists = await Client.exists({ _id: clientId });
    if (!clientExists) return null;

    const raisedDate = new Date();
    const complaint = await ComplaintSchema.create({
      ...input,
      clientId,
      photos,
      raisedDate,
      timeline: [{ status: "Pending", at: raisedDate }],
    });

    return complaint.toObject();
  }

  static async getComplaintById(id: number) {
    const complaint = await ComplaintSchema.findById(id).lean();
    if (!complaint) return null;

    const [client, rider, carriedOverDue] = await Promise.all([
      Client.findById(complaint.clientId)
        .select("client.site client.location client.contactNo wiring.status")
        .lean(),
      complaint.assignedTo ? Rider.findById(complaint.assignedTo).select("name").lean() : null,
      getCarriedOverDue(complaint.clientId.toString(), complaint._id!),
    ]);

    return {
      ...complaint,
      clientId: complaint.clientId.toString(),
      client: client
        ? {
            _id: client._id.toString(),
            site: client.client.site,
            location: client.client.location,
            contactNo: client.client.contactNo,
            installationStatus: client.wiring?.status ?? null,
          }
        : null,
      assignedTo: complaint.assignedTo
        ? { _id: complaint.assignedTo.toString(), name: rider?.name ?? null }
        : null,
      carriedOverDue,
    };
  }

  // Latest non-Resolved complaint for this client, or null if they have none —
  // powers the "active complaint" card on the mobile dashboard.
  static async getActiveComplaintForClient(clientId: string) {
    const complaint = await ComplaintSchema.findOne({ clientId, status: { $ne: "Resolved" } })
      .sort({ raisedDate: -1 })
      .select("_id")
      .lean();
    if (!complaint) return null;

    return Complaint.getComplaintById(complaint._id!);
  }

  // Same shape as getComplaintById, but scoped so a client can only ever fetch
  // their own complaint's timeline (never another client's by guessing an id).
  static async getComplaintForClient(id: number, clientId: string) {
    const complaint = await Complaint.getComplaintById(id);
    if (!complaint || complaint.clientId !== clientId) return null;
    return complaint;
  }

  // The assigned rider's live GPS fix for one of the client's own complaints —
  // powers Frontendui/src/screens/TrackRiderScreen.tsx. Same RiderLocation doc
  // the rider's background location task writes to and the admin's tracking
  // page reads from.
  static async getTrackingForClient(id: number, clientId: string) {
    const complaint = await ComplaintSchema.findById(id).select("clientId assignedTo").lean();
    if (!complaint || complaint.clientId.toString() !== clientId) return null;
    if (!complaint.assignedTo) return { rider: null, location: null };

    const [rider, location] = await Promise.all([
      Rider.findById(complaint.assignedTo).select("name phone").lean(),
      RiderLocation.findOne({ riderId: complaint.assignedTo }).lean(),
    ]);

    return {
      rider: rider ? { _id: rider._id.toString(), name: rider.name, phone: rider.phone } : null,
      location: location
        ? { latitude: location.latitude, longitude: location.longitude, updatedAt: location.updatedAt }
        : null,
    };
  }

  // Paginated, newest-first history of a client's own complaints — powers the
  // "load more" list on the mobile History screen.
  static async getComplaintsForClient(clientId: string, page: number) {
    const skip = (page - 1) * CLIENT_COMPLAINTS_PAGE_SIZE;

    const [complaints, totalCount] = await Promise.all([
      ComplaintSchema.find({ clientId })
        .sort({ raisedDate: -1 })
        .skip(skip)
        .limit(CLIENT_COMPLAINTS_PAGE_SIZE)
        .select("title status raisedDate assignedTo")
        .lean(),
      ComplaintSchema.countDocuments({ clientId }),
    ]);

    const riderIds = [
      ...new Set(
        complaints.filter((complaint) => complaint.assignedTo).map((complaint) => complaint.assignedTo!.toString()),
      ),
    ];
    const riders = await Rider.find({ _id: { $in: riderIds } }).select("name").lean();
    const riderNameById = new Map(riders.map((rider) => [rider._id.toString(), rider.name]));

    return {
      complaints: complaints.map((complaint) => ({
        _id: complaint._id,
        title: complaint.title,
        status: complaint.status,
        raisedDate: complaint.raisedDate,
        assignedTo: complaint.assignedTo ? (riderNameById.get(complaint.assignedTo.toString()) ?? null) : null,
      })),
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENT_COMPLAINTS_PAGE_SIZE)),
      totalCount,
    };
  }

  // Billed complaints only (amountDue > 0) — mirrors the admin web's payment
  // list filter. amountDue holds the last-billed amount even after the
  // complaint is marked Paid, so this doubles as a payment history record.
  static async getPaymentHistoryForClient(clientId: string, page: number) {
    const skip = (page - 1) * CLIENT_COMPLAINTS_PAGE_SIZE;
    const filter = { clientId, amountDue: { $gt: 0 } };

    const [complaints, totalCount] = await Promise.all([
      ComplaintSchema.find(filter)
        .sort({ raisedDate: -1 })
        .skip(skip)
        .limit(CLIENT_COMPLAINTS_PAGE_SIZE)
        .select("title raisedDate amountDue paymentStatus")
        .lean(),
      ComplaintSchema.countDocuments(filter),
    ]);

    return {
      payments: complaints.map((complaint) => ({
        _id: complaint._id,
        title: complaint.title,
        raisedDate: complaint.raisedDate,
        amount: complaint.amountDue,
        paymentStatus: complaint.paymentStatus,
      })),
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / CLIENT_COMPLAINTS_PAGE_SIZE)),
      totalCount,
    };
  }

  // Advances a rider's own job exactly one stage (Assigned -> On The Way ->
  // Arrived). Rejects if the complaint isn't assigned to this rider, or if
  // its current status has no next stage (e.g. already Arrived, or Resolved).
  static async advanceRiderJobStage(id: number, riderId: string): Promise<RiderJobActionResult> {
    const complaint = await ComplaintSchema.findById(id);
    if (!complaint) return { outcome: "not-found" };
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== riderId) {
      return { outcome: "forbidden" };
    }

    const nextStatus = RIDER_STAGE_ADVANCE[complaint.status];
    if (!nextStatus) return { outcome: "invalid-transition" };

    complaint.status = nextStatus;
    complaint.timeline.push({ status: nextStatus, at: new Date() });
    await complaint.save();

    // Only fires on Assigned -> On The Way (the only transition that lands on
    // this status) — lets the client know their rider actually set off.
    if (nextStatus === "On The Way") {
      const client = await Client.findById(complaint.clientId).select("expoPushToken").lean();
      await sendPushNotification(client?.expoPushToken, {
        title: "Your rider is on the way!",
        body: "Track your rider's live location now.",
        data: { complaintId: complaint._id, type: "rider-on-the-way" },
      });
    }

    const updated = await Complaint.getComplaintById(id);
    return { outcome: "ok", complaint: updated! };
  }

  // Rider marks their job done: attaches resolution notes/photos and moves it
  // to Pending Approval. Only an admin can close it from there (see
  // updateComplaint below) — mirrors the flow documented in complaint.schema.ts.
  static async submitRiderResolution(
    id: number,
    riderId: string,
    input: { notes?: string; photos: string[] },
  ): Promise<RiderJobActionResult> {
    const complaint = await ComplaintSchema.findById(id);
    if (!complaint) return { outcome: "not-found" };
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== riderId) {
      return { outcome: "forbidden" };
    }
    if (complaint.status !== "Arrived") return { outcome: "invalid-transition" };

    complaint.resolutionNotes = input.notes;
    complaint.resolutionPhotos = input.photos;
    complaint.riderResolvedAt = new Date();
    complaint.status = "Pending Approval";
    complaint.timeline.push({ status: "Pending Approval", at: new Date() });
    await complaint.save();

    const updated = await Complaint.getComplaintById(id);
    return { outcome: "ok", complaint: updated! };
  }

  static async updateComplaint(
    id: number,
    adminId: string,
    input: UpdateComplaintInput,
  ): Promise<UpdateComplaintResult> {
    const complaint = await ComplaintSchema.findById(id);
    if (!complaint) return { outcome: "not-found" };

    // A brand-new charge (0 doesn't count — that's not creating debt) can't
    // push a client past 2 other simultaneously open unpaid charges.
    if (input.amountDue !== undefined && input.amountDue > 0) {
      const unpaidCount = await countOtherUnpaidComplaints(complaint.clientId.toString(), complaint._id!);
      if (unpaidCount >= 2) return { outcome: "too-many-unpaid", unpaidCount };
    }

    const previousRiderId = complaint.assignedTo ? complaint.assignedTo.toString() : null;
    // What status this complaint ends up at — starts as whatever the admin explicitly
    // requested (or unchanged), but a fresh rider assignment can still bump it below.
    let nextStatus = input.status ?? complaint.status;

    if (input.assignedTo !== undefined) {
      const newRiderId = input.assignedTo;

      if (newRiderId !== null) {
        const riderExists = await Rider.exists({ _id: newRiderId });
        if (!riderExists) return { outcome: "rider-not-found" };
      }

      complaint.set("assignedTo", newRiderId);

      if (newRiderId !== previousRiderId) {
        // Keep riderAssignment.schema.ts's per-rider queue in sync: pull the
        // job off the old rider's queue, push it onto the new one's.
        if (previousRiderId) {
          await RiderAssignment.updateOne(
            { riderId: previousRiderId },
            { $pull: { complaintIds: complaint._id } },
          );
        }
        if (newRiderId) {
          await RiderAssignment.updateOne(
            { riderId: newRiderId },
            { $addToSet: { complaintIds: complaint._id } },
            { upsert: true },
          );
        }

        // Assigning a rider moves a still-Pending complaint into the queue,
        // unless the admin is explicitly setting some other status right now.
        if (newRiderId && nextStatus === "Pending") {
          nextStatus = "Assigned";
        }
      }
    }

    if (input.amountDue !== undefined) {
      // A brand-new charge always starts out Unpaid — admin confirms payment separately.
      if (complaint.amountDue === 0 && input.amountDue > 0) {
        complaint.paymentStatus = "Unpaid";
      }
      complaint.amountDue = input.amountDue;
      // Submitting any amountDue — even 0 — counts as pricing it (distinct
      // from a complaint that's simply never been touched by an admin yet).
      complaint.isPriced = true;

      // Total payable folds in any other unpaid balance this client still owes,
      // so settling "the total" clears their whole outstanding balance, not
      // just this one complaint's charge.
      const carriedOverDue = await getCarriedOverDue(complaint.clientId.toString(), complaint._id!);
      complaint.totalAmount = carriedOverDue + input.amountDue;
    }

    if (input.paymentStatus !== undefined) {
      complaint.paymentStatus = input.paymentStatus;
    }

    // Block closing a priced, still-unpaid complaint. Checked here (using
    // complaint.isPriced/amountDue/paymentStatus as already updated by the
    // blocks above) rather than after the status block runs, so a single
    // PATCH setting both paymentStatus:"Paid" and status:"Resolved" together
    // still succeeds, and a rejected close never triggers the rider-queue
    // side effect below.
    if (nextStatus === "Resolved" && complaint.isPriced && complaint.amountDue > 0 && complaint.paymentStatus !== "Paid") {
      return { outcome: "unpaid-balance" };
    }

    if (nextStatus !== complaint.status) {
      complaint.status = nextStatus;
      complaint.timeline.push({ status: nextStatus, at: new Date() });
      if (nextStatus === "Resolved") {
        complaint.resolvedDate = new Date();
        complaint.set("approvedBy", adminId);

        // Job's done — drop it from the rider's active queue. assignedTo itself
        // stays put as the historical record of who did the work.
        if (complaint.assignedTo) {
          await RiderAssignment.updateOne(
            { riderId: complaint.assignedTo },
            { $pull: { complaintIds: complaint._id } },
          );
        }
      }
    }

    await complaint.save();

    const updated = await Complaint.getComplaintById(id);
    return { outcome: "ok", complaint: updated! };
  }

  static async getAllComplaints(page: number, options: ListComplaintsOptions = {}) {
    const filter: FilterQuery<ComplaintDocument> = {};

    if (options.bucket === "completed") {
      filter.status = "Resolved";
    } else if (options.bucket === "pending") {
      filter.status = { $ne: "Resolved" };
    }

    if (options.riderId === "unassigned") {
      filter.assignedTo = null;
    } else if (options.riderId && isValidObjectId(options.riderId)) {
      filter.assignedTo = options.riderId as FilterQuery<ComplaintDocument>["assignedTo"];
    }

    if (options.clientId && isValidObjectId(options.clientId)) {
      filter.clientId = options.clientId as FilterQuery<ComplaintDocument>["clientId"];
    }

    if (options.date) {
      const startOfDay = new Date(`${options.date}T00:00:00.000Z`);
      const startOfNextDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      filter.raisedDate = { $gte: startOfDay, $lt: startOfNextDay };
    }

    if (options.paymentStatus) {
      filter.amountDue = { $gt: 0 };
      filter.paymentStatus = options.paymentStatus;
    }

    if (options.search) {
      const regex = new RegExp(escapeRegex(options.search), "i");
      const matchingClients = await Client.find({
        $or: [{ "client.site": regex }, { "client.location": regex }],
      })
        .select("_id")
        .lean();
      const matchingClientIds = matchingClients.map((client) => client._id);

      const or: FilterQuery<ComplaintDocument>[] = [
        { title: regex },
        { clientId: { $in: matchingClientIds } },
      ];
      const numericId = Number(options.search);
      if (Number.isInteger(numericId)) or.push({ _id: numericId });

      filter.$or = or;
    }

    const skip = (page - 1) * COMPLAINTS_PAGE_SIZE;

    const [complaints, totalCount] = await Promise.all([
      ComplaintSchema.find(filter)
        .sort({ raisedDate: -1 })
        .skip(skip)
        .limit(COMPLAINTS_PAGE_SIZE)
        .lean(),
      ComplaintSchema.countDocuments(filter),
    ]);

    const clientIds = [...new Set(complaints.map((complaint) => complaint.clientId.toString()))];
    const riderIds = [
      ...new Set(
        complaints
          .filter((complaint) => complaint.assignedTo)
          .map((complaint) => complaint.assignedTo!.toString()),
      ),
    ];

    const [clients, riders, unpaidCounts] = await Promise.all([
      Client.find({ _id: { $in: clientIds } }).select("client.site client.location").lean(),
      Rider.find({ _id: { $in: riderIds } }).select("name").lean(),
      ComplaintSchema.aggregate([
        { $match: { amountDue: { $gt: 0 }, paymentStatus: "Unpaid" } },
        { $group: { _id: "$clientId", count: { $sum: 1 } } },
      ]),
    ]);

    const clientById = new Map(clients.map((client) => [client._id.toString(), client.client]));
    const riderNameById = new Map(riders.map((rider) => [rider._id.toString(), rider.name]));
    const unpaidCountByClientId = new Map(
      unpaidCounts.map((entry) => [entry._id.toString(), entry.count as number]),
    );

    const items = complaints.map((complaint) => {
      const clientIdStr = complaint.clientId.toString();
      const client = clientById.get(clientIdStr);
      const isSelfUnpaid = complaint.amountDue > 0 && complaint.paymentStatus === "Unpaid";
      const clientUnpaidCount = unpaidCountByClientId.get(clientIdStr) ?? 0;

      return {
        _id: complaint._id,
        title: complaint.title,
        status: complaint.status,
        raisedDate: complaint.raisedDate,
        amountDue: complaint.amountDue,
        paymentStatus: complaint.paymentStatus,
        clientId: clientIdStr,
        site: client?.site ?? "",
        location: client?.location ?? "",
        assignedTo: complaint.assignedTo ? (riderNameById.get(complaint.assignedTo.toString()) ?? null) : null,
        // A client with 2+ unpaid complaints has "other" unpaid ones from the
        // perspective of any one of them; with exactly 1, only complaints that
        // aren't themselves that unpaid one count as having "other" unpaid.
        hasOtherUnpaid: isSelfUnpaid ? clientUnpaidCount > 1 : clientUnpaidCount > 0,
      };
    });

    return {
      complaints: items,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / COMPLAINTS_PAGE_SIZE)),
      totalCount,
    };
  }
}
