import { Schema, model, type InferSchemaType } from "mongoose";

// One pinned location per client — captured via the "confirm location" step
// in Frontendui/src/screens/ConfirmLocationScreen.tsx when raising a complaint,
// so riders can navigate straight to the client's site.

const coordinatesSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true },
  },
  { timestamps: true },
);

export type CoordinatesDocument = InferSchemaType<typeof coordinatesSchema>;
export const Coordinates = model("Coordinates", coordinatesSchema);
