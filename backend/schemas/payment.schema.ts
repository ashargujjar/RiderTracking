import { Schema, model, type InferSchemaType } from "mongoose";

// One document per payment attempt against a complaint (not just the current
// balance) so retries and webhook redeliveries from a gateway like SafePay
// don't clobber each other — Complaint.paymentStatus/amountDue reflect the
// latest confirmed state, this collection is the audit trail behind it.

export const PAYMENT_GATEWAYS = ["safepay", "cash", "bank_transfer"] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export const PAYMENT_TRANSACTION_STATUSES = ["initiated", "completed", "failed", "cancelled"] as const;
export type PaymentTransactionStatus = (typeof PAYMENT_TRANSACTION_STATUSES)[number];

const paymentSchema = new Schema(
  {
    complaintId: { type: Number, ref: "Complaint", required: true, index: true },
    // Other complaint ids this payment's amount also settles — carried-over
    // debt folded into the charge, copied from the complaint's
    // carriedOverComplaintIds at checkout time. See complaint.model.ts's
    // getCarriedOverComplaints.
    settledComplaintIds: { type: [Number], default: [] },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: PAYMENT_TRANSACTION_STATUSES,
      required: true,
      default: "initiated",
    },
    // SafePay's order/tracker id, assigned when the checkout is created.
    gatewayOrderId: { type: String, trim: true, index: true },
    // SafePay's transaction id, only present once the payment settles.
    gatewayReference: { type: String, trim: true },
    // Raw webhook/callback payload, kept for audits and support disputes.
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const Payment = model("Payment", paymentSchema);