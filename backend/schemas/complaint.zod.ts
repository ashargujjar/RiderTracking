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
  clientId: z.string().trim().min(1).optional(),
  // Calendar day (UTC) the complaint was raised on, e.g. "2026-08-18".
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export type ListComplaintsQuery = z.infer<typeof listComplaintsQuerySchema>;

export const submitResolutionSchema = z.object({
  notes: z.string().trim().min(1).optional(),
});

export type SubmitResolutionInput = z.infer<typeof submitResolutionSchema>;

export const updateComplaintSchema = z
  .object({
    status: z.enum(COMPLAINT_STATUSES).optional(),
    assignedTo: z.string().trim().min(1).nullable().optional(),
    // totalAmount is intentionally not settable here — it's always derived
    // server-side from amountDue plus the client's other carried-over dues.
    amountDue: z.coerce.number().min(0).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "No fields to update");

export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
