import { Schema, model, type InferSchemaType } from "mongoose";

import { nextSequence } from "./counter.schema";

// Mirrors the complaint detail view in webFrontend/src/pages/ComplaintDetailPage.tsx
// (route: /dashboard/complaints/:id/view) and the rider-facing job flow in Frontendui.
//
// Timeline: Pending -> Assigned -> On The Way -> Arrived -> Pending Approval -> Resolved.
// The rider drives every step through "Pending Approval" (tapping "Start Now" moves it
// to On The Way, arriving moves it to Arrived, marking the job done — with resolution
// photos — submits it for review). Only an admin can move it from "Pending Approval" to
// the final "Resolved", which closes it.
export const COMPLAINT_STATUSES = [
  "Pending",
  "Assigned",
  "On The Way",
  "Arrived",
  "Pending Approval",
  "Resolved",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const PAYMENT_STATUSES = ["Paid", "Unpaid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const timelineEventSchema = new Schema(
  {
    status: { type: String, enum: COMPLAINT_STATUSES, required: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const complaintSchema = new Schema(
  {
    // Sequential (1, 2, 3, ...) instead of an ObjectId, to match the #<id> shown
    // throughout the UI and keep complaint URLs short — assigned in the pre-save
    // hook below via the shared counter, never set by the client.
    _id: { type: Number },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    photos: [{ type: String, trim: true }], // hosted photo URLs the client attached when raising it
    status: { type: String, enum: COMPLAINT_STATUSES, required: true, default: "Pending" },
    // Append-only log of every status change, so the app can render the actual
    // timeline (which stage, and when) instead of just the current status.
    timeline: { type: [timelineEventSchema], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Rider", default: null, index: true },
    raisedDate: { type: Date, required: true, default: Date.now },

    // Rider's proof of work — submitted together when marking the job done, which
    // moves status to "Pending Approval" rather than closing the complaint outright.
    resolutionNotes: { type: String, trim: true },
    resolutionPhotos: { type: [String], default: [] }, // hosted photo URLs — 0, 1, or more, fully optional
    riderResolvedAt: { type: Date }, // when the rider submitted the job for approval

    // Set once an admin approves and closes the complaint (status -> "Resolved").
    resolvedDate: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Full amount billed for this complaint (e.g. parts + labor).
    totalAmount: { type: Number, required: true, default: 0, min: 0 },
    // Remaining balance still owed — equals totalAmount until a partial payment is recorded.
    amountDue: { type: Number, required: true, default: 0, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: "Unpaid" },
  },
  { timestamps: true },
);

complaintSchema.pre("save", async function (next) {
  if (this.isNew && this._id === undefined) {
    this._id = await nextSequence("complaint");
  }
  next();
});

export type ComplaintDocument = InferSchemaType<typeof complaintSchema>;
export const Complaint = model("Complaint", complaintSchema);
