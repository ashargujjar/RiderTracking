import { isValidObjectId, Types, type FilterQuery } from "mongoose";

import { Client } from "../schemas/client.schema";
import { Complaint as ComplaintSchema, type ComplaintDocument } from "../schemas/complaint.schema";
import { Rider } from "../schemas/rider.schema";
import { RiderAssignment } from "../schemas/riderAssignment.schema";
import type { CreateComplaintInput, UpdateComplaintInput } from "../schemas/complaint.zod";

export type UpdateComplaintResult =
  | { outcome: "not-found" }
  | { outcome: "rider-not-found" }
  | { outcome: "ok"; complaint: NonNullable<Awaited<ReturnType<typeof Complaint.getComplaintById>>> };

// Matches PAGE_SIZE_TABLE in webFrontend/src/data/constants.ts
const COMPLAINTS_PAGE_SIZE = 8;

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

type ListComplaintsOptions = {
  search?: string;
  bucket?: "pending" | "completed";
  riderId?: string;
};

export class Complaint {
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

  static async updateComplaint(
    id: number,
    adminId: string,
    input: UpdateComplaintInput,
  ): Promise<UpdateComplaintResult> {
    const complaint = await ComplaintSchema.findById(id);
    if (!complaint) return { outcome: "not-found" };

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

      // Total payable folds in any other unpaid balance this client still owes,
      // so settling "the total" clears their whole outstanding balance, not
      // just this one complaint's charge.
      const carriedOverDue = await getCarriedOverDue(complaint.clientId.toString(), complaint._id!);
      complaint.totalAmount = carriedOverDue + input.amountDue;
    }

    if (input.paymentStatus !== undefined) {
      complaint.paymentStatus = input.paymentStatus;
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
