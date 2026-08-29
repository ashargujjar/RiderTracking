import type { Request, Response } from "express";

import { Payment } from "../model/payment.model";
import { verifySafepayWebhookSignature } from "../middleware/safepay";

export async function createCheckout(req: Request, res: Response) {
  try {
    const complaintId = Number(req.params.complaintId);
    if (!Number.isInteger(complaintId)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const clientId = res.locals.clientId as string;
    const result = await Payment.initiatePayment(complaintId, clientId);

    if (result.outcome === "not-found") {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }
    if (result.outcome === "nothing-due") {
      res.status(409).json({ success: false, message: "This complaint has nothing due to pay" });
      return;
    }
    if (result.outcome === "already-pending") {
      res.status(409).json({
        success: false,
        message: "A payment for this complaint is already in progress",
        outcome: "already-pending",
      });
      return;
    }

    res.status(200).json({ success: true, checkoutUrl: result.checkoutUrl });
  } catch (error) {
    console.error("Failed to create Safepay checkout:", error);
    res.status(500).json({ success: false, message: "Failed to create checkout session" });
  }
}

export async function cancelCheckout(req: Request, res: Response) {
  try {
    const complaintId = Number(req.params.complaintId);
    if (!Number.isInteger(complaintId)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const clientId = res.locals.clientId as string;
    const result = await Payment.cancelPendingPayment(complaintId, clientId);

    if (result.outcome === "not-found") {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to cancel Safepay checkout:", error);
    res.status(500).json({ success: false, message: "Failed to cancel checkout" });
  }
}

export async function safepayWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-sfpy-signature"];
    const data = req.body?.data;
    const type = req.body?.type;

    if (typeof signature !== "string" || !data || !verifySafepayWebhookSignature(data, signature)) {
      res.status(401).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const result = await Payment.handleWebhook({ type, data });
    console.log(`Safepay webhook [${result.version}] (${type}): ${result.outcome}`);
    // Safepay retries delivery until it gets a 200 — always acknowledge once
    // the signature checks out, even if we ignored the payload (e.g. unknown
    // tracker, already-settled payment).
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to process Safepay webhook:", error);
    res.status(500).json({ success: false, message: "Failed to process webhook" });
  }
}
