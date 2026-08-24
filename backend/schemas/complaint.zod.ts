import { z } from "zod";

import { COMPLAINT_STATUSES, PAYMENT_STATUSES } from "./complaint.schema";

export const createComplaintSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const listComplaintsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().trim().min(1).optional(),
  bucket: z.enum(["pending", "completed"]).optional(),
  riderId: z.string().trim().min(1).optional(),
});

export type ListComplaintsQuery = z.infer<typeof listComplaintsQuerySchema>;

export const updateComplaintSchema = z
  .object({
    status: z.enum(COMPLAINT_STATUSES).optional(),
    assignedTo: z.string().trim().min(1).nullable().optional(),
    totalAmount: z.coerce.number().min(0).optional(),
    amountDue: z.coerce.number().min(0).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "No fields to update");

export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
