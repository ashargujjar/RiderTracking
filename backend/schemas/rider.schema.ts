import { Schema, model, type InferSchemaType } from "mongoose";

// Mirrors the "Add Rider" form in webFrontend/src/pages/RiderFormPage.tsx
// (route: /dashboard/riders/new) — all fields there are required.

export const RIDER_CATEGORIES = ["Employee", "Vendor"] as const;
export type RiderCategory = (typeof RIDER_CATEGORIES)[number];

const riderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    category: { type: String, enum: RIDER_CATEGORIES, required: true },
    username: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export type RiderDocument = InferSchemaType<typeof riderSchema>;
export const Rider = model("Rider", riderSchema);
