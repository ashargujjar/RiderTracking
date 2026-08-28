import { Complaint as ComplaintSchema } from "../schemas/complaint.schema";
import { Payment as PaymentSchema } from "../schemas/payment.schema";
import { createSafepayOrder, buildSafepayCheckoutUrl } from "../middleware/safepay";
import { Complaint } from "./complaint.model";

export type InitiatePaymentResult =
  | { outcome: "not-found" }
  | { outcome: "nothing-due" }
  | { outcome: "ok"; checkoutUrl: string };

// Base app URL Safepay redirects the browser back to after checkout — not
// used to confirm payment (the webhook is the source of truth for that),
// just where to send the user once they're done on Safepay's hosted page.
const APP_URL = process.env.CORS_ORIGIN ?? "http://localhost:5173";

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
      redirectUrl: `${APP_URL}/payment-complete`,
      cancelUrl: `${APP_URL}/payment-cancelled`,
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
