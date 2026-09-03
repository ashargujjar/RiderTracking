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
    // Compass direction of travel in degrees clockwise from true north.
    // Optional — omitted (not stored as null) whenever the device's GPS fix
    // didn't include a usable course, e.g. while the rider is stationary.
    heading: { type: Number, min: 0, max: 360 },
  },
  { timestamps: true },
);

export type RiderLocationDocument = InferSchemaType<typeof riderLocationSchema>;
export const RiderLocation = model("RiderLocation", riderLocationSchema);
