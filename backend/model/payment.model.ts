import { Complaint as ComplaintSchema } from "../schemas/complaint.schema";
import { Payment as PaymentSchema } from "../schemas/payment.schema";
import { createSafepayOrder, buildSafepayCheckoutUrl } from "../middleware/safepay";
import { Complaint } from "./complaint.model";

export type InitiatePaymentResult =
  | { outcome: "not-found" }
  | { outcome: "nothing-due" }
  | { outcome: "ok"; checkoutUrl: string };

// Where Safepay redirects the phone's browser after checkout — not used to
// confirm payment (the webhook is the source of truth for that), just a
// landing page so the browser doesn't dead-end. The mobile app has no deep
// link scheme registered to catch this, so it points at a small static page
// served by this backend rather than the admin dashboard (CORS_ORIGIN).
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 5000}`;

export class Payment {
  static async initiatePayment(complaintId: number, clientId: string): Promise<InitiatePaymentResult> {
    const complaint = await Complaint.getComplaintForClient(complaintId, clientId);
    if (!complaint) return { outcome: "not-found" };
    if (!complaint.isPriced || complaint.totalAmount <= 0 || complaint.paymentStatus === "Paid") {
      return { outcome: "nothing-due" };
    }

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
      gateway: "safepay",
      amount: complaint.totalAmount,
      status: "initiated",
      gatewayOrderId: token,
    });

    return { outcome: "ok", checkoutUrl };
  }

  // Called from the Safepay webhook once its signature has already been
  // verified by the caller. Looks up the Payment record this notification
  // belongs to via the tracker token we stored when the order was created —
  // matches on notification.tracker first (documented field), falling back to
  // the outer data.token in case of a naming difference between API versions.
  static async handleWebhook(payload: {
    token?: string;
    notification?: { tracker?: string; state?: string };
  }): Promise<{ outcome: "ignored" | "applied" }> {
    const trackerToken = payload.notification?.tracker ?? payload.token;
    if (!trackerToken) return { outcome: "ignored" };

    const payment = await PaymentSchema.findOne({ gatewayOrderId: trackerToken });
    if (!payment || payment.status !== "initiated") return { outcome: "ignored" };

    const isPaid = payload.notification?.state === "PAID";
    payment.status = isPaid ? "completed" : "failed";
    payment.gatewayResponse = payload;
    await payment.save();

    if (isPaid) {
      await ComplaintSchema.updateOne({ _id: payment.complaintId }, { $set: { paymentStatus: "Paid" } });
    }

    return { outcome: "applied" };
  }
}
