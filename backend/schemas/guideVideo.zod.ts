import { z } from "zod";

export const createGuideVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  link: z.string().trim().min(1, "Link is required").url("Must be a valid URL"),
});

export type CreateGuideVideoInput = z.infer<typeof createGuideVideoSchema>;

export const editGuideVideoSchema = createGuideVideoSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, "No fields to update");

export type EditGuideVideoInput = z.infer<typeof editGuideVideoSchema>;

export const listGuideVideosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ListGuideVideosQuery = z.infer<typeof listGuideVideosQuerySchema>;
