import { Schema, model, type InferSchemaType } from "mongoose";

// One document per rider — the ordered queue of complaints currently assigned
// to them. Complaint.assignedTo (see complaint.schema.ts) already points a
// single complaint at its rider; this is the reverse index, letting a rider
// carry more than one open job at a time without scanning every complaint.
// complaintIds is a FIFO queue: index 0 is the job the rider should work next.

const riderAssignmentSchema = new Schema(
  {
    riderId: { type: Schema.Types.ObjectId, ref: "Rider", required: true, unique: true },
    complaintIds: { type: [Number], ref: "Complaint", default: [] },
  },
  { timestamps: true },
);

export type RiderAssignmentDocument = InferSchemaType<typeof riderAssignmentSchema>;
export const RiderAssignment = model("RiderAssignment", riderAssignmentSchema);
