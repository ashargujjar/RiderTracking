import { Router } from "express";

import { cancelCheckout, createCheckout, safepayWebhook } from "../controller/payment.controller";
import { verifyClient } from "../middleware/verifyClient";

const router = Router();

router.post("/:complaintId/checkout", verifyClient, createCheckout);
router.post("/:complaintId/cancel", verifyClient, cancelCheckout);
// Called by Safepay's servers, not the app — protected by signature
// verification (verifySafepayWebhookSignature) rather than a JWT.
router.post("/webhooks/safepay", safepayWebhook);

// Landing pages Safepay's hosted checkout redirects the phone's browser to —
// the mobile app has no deep link scheme to catch this, so these just tell
// the client to switch back. Actual payment confirmation is the webhook above.
router.get("/complete", (_req, res) => {
  res.send("<p>Payment received. You can close this tab and return to the Catkin app.</p>");
});
router.get("/cancelled", (_req, res) => {
  res.send("<p>Payment cancelled. You can close this tab and return to the Catkin app.</p>");
});

export default router;
