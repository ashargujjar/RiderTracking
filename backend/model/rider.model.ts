import { isValidObjectId, type FilterQuery } from "mongoose";

import { Rider as RiderSchema, type RiderDocument } from "../schemas/rider.schema";
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
}
