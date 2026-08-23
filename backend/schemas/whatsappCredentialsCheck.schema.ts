import { Schema, model, type InferSchemaType } from "mongoose";

// Tracks whether a client's login credentials have been sent to them via
// WhatsApp — mirrors ClientRecord.whatsappSent in webFrontend/src/data/mockClients.ts.

const whatsappCredentialsCheckSchema = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
    sent: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export type WhatsappCredentialsCheckDocument = InferSchemaType<typeof whatsappCredentialsCheckSchema>;
export const WhatsappCredentialsCheck = model(
  "WhatsappCredentialsCheck",
  whatsappCredentialsCheckSchema
);
