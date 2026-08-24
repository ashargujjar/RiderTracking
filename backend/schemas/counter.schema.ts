import { Schema, model, type InferSchemaType } from "mongoose";

// Backs auto-incrementing, human-friendly numeric IDs (e.g. Complaint #1, #2, ...)
// since MongoDB's default _id (ObjectId) isn't sequential. One document per counter,
// keyed by name, atomically incremented via Counter.next(name).

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export type CounterDocument = InferSchemaType<typeof counterSchema>;
export const Counter = model("Counter", counterSchema);

export async function nextSequence(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
}
