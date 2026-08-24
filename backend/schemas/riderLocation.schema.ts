import { Schema, model, type InferSchemaType } from "mongoose";

// Live GPS location for a rider, refreshed while they're working a job, so
// the admin can see their actual position on RiderTrackingPage.tsx (route:
// /dashboard/riders/:id/tracking). One document per rider — `updatedAt`
// (from timestamps below) is when this fix was last reported, i.e. how
// fresh/stale the pin on the admin's map actually is.

const riderLocationSchema = new Schema(
  {
    riderId: { type: Schema.Types.ObjectId, ref: "Rider", required: true, unique: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
  },
  { timestamps: true },
);

export type RiderLocationDocument = InferSchemaType<typeof riderLocationSchema>;
export const RiderLocation = model("RiderLocation", riderLocationSchema);
