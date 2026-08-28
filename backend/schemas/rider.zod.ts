import { z } from "zod";

import { RIDER_CATEGORIES } from "./rider.schema";

export const createRiderSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  category: z.enum(RIDER_CATEGORIES),
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreateRiderInput = z.infer<typeof createRiderSchema>;

export const riderLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type RiderLoginInput = z.infer<typeof riderLoginSchema>;

export const listRidersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().trim().min(1).optional(),
});

export type ListRidersQuery = z.infer<typeof listRidersQuerySchema>;
