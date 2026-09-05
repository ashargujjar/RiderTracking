import { Complaint as ComplaintSchema } from "../schemas/complaint.schema";
import { Payment as PaymentSchema } from "../schemas/payment.schema";
import {
  createSafepayOrder,
  buildSafepayCheckoutUrl,
} from "../middleware/safepay";
import { Complaint } from "./complaint.model";

export type InitiatePaymentResult =
  | { outcome: "not-found" }
  | { outcome: "nothing-due" }
  | { outcome: "already-pending" }
  | { outcome: "ok"; checkoutUrl: string };

export type CancelPendingPaymentResult =
  | { outcome: "not-found" }
  | { outcome: "ok" };

// Where Safepay redirects the phone's browser after checkout — not used to
// confirm payment (the webhook is the source of truth for that), just a
// landing page so the browser doesn't dead-end. The mobile app has no deep
// link scheme registered to catch this, so it points at a small static page
// served by this backend rather than the admin dashboard (CORS_ORIGIN).
const BACKEND_PUBLIC_URL =
  process.env.BACKEND_PUBLIC_URL ??
  `http://localhost:${process.env.PORT ?? 5000}`;

export class Payment {
  static async initiatePayment(
    complaintId: number,
    clientId: string,
  ): Promise<InitiatePaymentResult> {
    const complaint = await Complaint.getComplaintForClient(
      complaintId,
      clientId,
    );
    if (!complaint) return { outcome: "not-found" };
    if (
      !complaint.isPriced ||
      complaint.totalAmount <= 0 ||
      complaint.paymentStatus === "Paid"
    ) {
      return { outcome: "nothing-due" };
    }

    // Refuse a second checkout while one is already awaiting webhook
    // confirmation — each tap otherwise created a brand-new Safepay order,
    // meaning a real risk of being charged more than once for the same bill.
    const pending = await PaymentSchema.exists({
      complaintId,
      status: "initiated",
    });
    if (pending) return { outcome: "already-pending" };

    const orderId = `catkin-${complaintId}-${Date.now()}`;
    const { token } = await createSafepayOrder({
      amountInRupees: complaint.totalAmount,
      currency: "PKR",
      orderId,
    });

    const checkoutUrl = buildSafepayCheckoutUrl({
      token,
      orderId,
      redirectUrl: `${BACKEND_PUBLIC_URL}/payments/complete`,
      cancelUrl: `${BACKEND_PUBLIC_URL}/payments/cancelled`,
    });

    await PaymentSchema.create({
      complaintId,
      settledComplaintIds: complaint.carriedOverComplaintIds ?? [],
      gateway: "safepay",
      amount: complaint.totalAmount,
      status: "initiated",
      gatewayOrderId: token,
    });

    return { outcome: "ok", checkoutUrl };
  }

  // Lets the client back out of a stuck/abandoned attempt (e.g. they closed
  // the browser without finishing, or the card was declined without us
  // hearing a webhook for it) so they aren't locked out of paying forever.
  static async cancelPendingPayment(
    complaintId: number,
    clientId: string,
  ): Promise<CancelPendingPaymentResult> {
    const complaint = await Complaint.getComplaintForClient(
      complaintId,
      clientId,
    );
    if (!complaint) return { outcome: "not-found" };

    await PaymentSchema.updateMany(
      { complaintId, status: "initiated" },
      { $set: { status: "cancelled" } },
    );

    return { outcome: "ok" };
  }

  // Called from the Safepay webhook once its signature has already been
  // verified by the caller. Safepay's account has two event schema versions
  // live side by side (confirmed by capturing a real delivery of each):
  //   v2.0.0 — { type: "payment.succeeded"/"payment.failed", data: { tracker, ... } }
  //   v1.0.0 — { data: { type: "payment:created", notification: { tracker, state: "PAID", ... } } }
  // Note the v1 shape nests everything one level deeper than v2 — its "type"
  // and the actual tracker/state live inside data, not at the top level.
  // Only v2.0.0 is actually subscribed for real traffic, but both are wired
  // up since the v1 test event does pass signature verification for real.
  static async handleWebhook(payload: {
    type?: string;
    data: {
      tracker?: string;
      type?: string;
      notification?: { tracker?: string; state?: string };
    };
  }): Promise<{ outcome: "ignored" | "applied"; version: "v1" | "v2" | "unknown" }> {
    let version: "v1" | "v2" | "unknown";
    let isPaid: boolean;
    let trackerToken: string | undefined;

    if (payload.type === "payment.succeeded" || payload.type === "payment.failed") {
      version = "v2";
      isPaid = payload.type === "payment.succeeded";
      trackerToken = payload.data?.tracker;
    } else if (payload.data?.type === "payment:created") {
      version = "v1";
      isPaid = payload.data.notification?.state === "PAID";
      trackerToken = payload.data.notification?.tracker;
    } else {
      // Other event kinds (authorization.succeeded, void.succeeded, refund
      // events, an unrecognized v1 type, etc.) are intermediate/unhandled —
      // leave the payment as "initiated" rather than guessing.
      return { outcome: "ignored", version: "unknown" };
    }

    if (!trackerToken) return { outcome: "ignored", version };

    const payment = await PaymentSchema.findOne({
      gatewayOrderId: trackerToken,
    });
    if (!payment || payment.status !== "initiated")
      return { outcome: "ignored", version };

    payment.status = isPaid ? "completed" : "failed";
    payment.gatewayResponse = payload;
    await payment.save();

    if (isPaid) {
      // Settle this complaint AND every other one whose carried-over debt
      // was folded into the amount actually charged — otherwise only the
      // complaint the client tapped "Pay" from gets marked Paid, even though
      // the full combined balance was collected. The paymentStatus:"Unpaid"
      // guard keeps this idempotent/safe if one was already settled another
      // way (e.g. an admin recording it as cash) in the meantime.
      const settledIds = [payment.complaintId, ...(payment.settledComplaintIds ?? [])];
      await ComplaintSchema.updateMany(
        { _id: { $in: settledIds }, paymentStatus: "Unpaid" },
        { $set: { paymentStatus: "Paid" } },
      );
    }

    return { outcome: "applied", version };
  }
}
