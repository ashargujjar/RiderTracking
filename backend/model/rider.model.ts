import { isValidObjectId, type FilterQuery } from "mongoose";

import { Client } from "../schemas/client.schema";
import { Complaint } from "../schemas/complaint.schema";
import { Coordinates } from "../schemas/coordinates.schema";
import { Rider as RiderSchema, type RiderDocument } from "../schemas/rider.schema";
import { RiderAssignment } from "../schemas/riderAssignment.schema";
import { RiderLocation } from "../schemas/riderLocation.schema";
import type { CreateRiderInput } from "../schemas/rider.zod";

// Matches PAGE_SIZE_TABLE in webFrontend/src/data/constants.ts
const RIDERS_PAGE_SIZE = 8;

function buildSearchFilter(search: string): FilterQuery<RiderDocument> {
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const or: FilterQuery<RiderDocument>[] = [
    { name: regex },
    { phone: regex },
    { category: regex },
    { username: regex },
  ];
  if (isValidObjectId(search)) {
    or.push({ _id: search } as FilterQuery<RiderDocument>);
  }

  return { $or: or };
}

export class Rider {
  static async createRider(input: CreateRiderInput) {
    const rider = await RiderSchema.create(input);
    const { password, ...safeRider } = rider.toObject();
    return safeRider;
  }

  static async getAllRiders(page: number, search?: string) {
    const skip = (page - 1) * RIDERS_PAGE_SIZE;
    const filter = search ? buildSearchFilter(search) : {};

    const [riders, totalCount] = await Promise.all([
      RiderSchema.find(filter).skip(skip).limit(RIDERS_PAGE_SIZE).lean(),
      RiderSchema.countDocuments(filter),
    ]);

    const safeRiders = riders.map(({ password, ...rest }) => rest);

    return {
      riders: safeRiders,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / RIDERS_PAGE_SIZE)),
      totalCount,
    };
  }

  static async getRiderById(id: string) {
    const rider = await RiderSchema.findById(id).lean();
    if (!rider) return null;

    return rider;
  }

  static async getTracking(id: string) {
    const riderExists = await RiderSchema.exists({ _id: id });
    if (!riderExists) return null;

    const [location, assignment] = await Promise.all([
      RiderLocation.findOne({ riderId: id }).lean(),
      RiderAssignment.findOne({ riderId: id }).lean(),
    ]);

    const complaintIds = assignment?.complaintIds ?? [];
    const complaints = complaintIds.length
      ? await Complaint.find({ _id: { $in: complaintIds } })
          .select("title status raisedDate clientId")
          .lean()
      : [];
    const complaintById = new Map(complaints.map((complaint) => [complaint._id, complaint]));

    const clientIds = [...new Set(complaints.map((complaint) => complaint.clientId.toString()))];
    const [clients, coordinatesList] = await Promise.all([
      Client.find({ _id: { $in: clientIds } }).select("client.site").lean(),
      Coordinates.find({ clientId: { $in: clientIds } }).lean(),
    ]);
    const siteByClientId = new Map(clients.map((client) => [client._id.toString(), client.client.site]));
    const coordinatesByClientId = new Map(
      coordinatesList.map((coords) => [
        coords.clientId.toString(),
        { latitude: coords.latitude, longitude: coords.longitude },
      ]),
    );

    // Preserve queue order (complaintIds is a FIFO array — index 0 is next up),
    // skipping any id that no longer resolves to a real complaint.
    const jobs = complaintIds
      .map((complaintId) => complaintById.get(complaintId))
      .filter((complaint): complaint is NonNullable<typeof complaint> => Boolean(complaint))
      .map((complaint) => {
        const clientIdStr = complaint.clientId.toString();
        return {
          id: complaint._id,
          title: complaint.title,
          status: complaint.status,
          raisedDate: complaint.raisedDate,
          site: siteByClientId.get(clientIdStr) ?? "",
          coordinates: coordinatesByClientId.get(clientIdStr) ?? null,
        };
      });

    return {
      location: location
        ? { latitude: location.latitude, longitude: location.longitude, updatedAt: location.updatedAt }
        : null,
      jobs,
    };
  }

  static async getOrderStats(id: string) {
    const riderExists = await RiderSchema.exists({ _id: id });
    if (!riderExists) return null;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [assignedCount, totalCompletedCount, monthlyCompletedCount, previousMonthCompletedCount] =
      await Promise.all([
        Complaint.countDocuments({ assignedTo: id }),
        Complaint.countDocuments({ assignedTo: id, status: "Resolved" }),
        Complaint.countDocuments({
          assignedTo: id,
          status: "Resolved",
          resolvedDate: { $gte: startOfThisMonth, $lt: startOfNextMonth },
        }),
        Complaint.countDocuments({
          assignedTo: id,
          status: "Resolved",
          resolvedDate: { $gte: startOfPreviousMonth, $lt: startOfThisMonth },
        }),
      ]);

    return { assignedCount, totalCompletedCount, monthlyCompletedCount, previousMonthCompletedCount };
  }
}
