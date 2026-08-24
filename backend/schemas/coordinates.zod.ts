import { z } from "zod";

export const upsertCoordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().min(1).optional(),
});

export type UpsertCoordinatesInput = z.infer<typeof upsertCoordinatesSchema>;
