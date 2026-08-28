import { Router } from "express";

import { createCheckout, safepayWebhook } from "../controller/payment.controller";
import { verifyClient } from "../middleware/verifyClient";

const router = Router();

router.post("/:complaintId/checkout", verifyClient, createCheckout);
// Called by Safepay's servers, not the app — protected by signature
// verification (verifySafepayWebhookSignature) rather than a JWT.
router.post("/webhooks/safepay", safepayWebhook);

export default router;
