import { Router } from "express";

import {
  advanceMyJobStage,
  createComplaint,
  getAllComplaints,
  getComplaint,
  getMyActiveComplaint,
  getMyComplaint,
  getMyComplaints,
  getMyComplaintTracking,
  getMyPaymentHistory,
  submitMyJobResolution,
  updateComplaint,
} from "../controller/complaint.controller";
import { upload } from "../middleware/cloudinary";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyClient } from "../middleware/verifyClient";
import { verifyRider } from "../middleware/verifyRider";

const router = Router();

// Matches MAX_IMAGES in Frontendui/src/screens/NewComplaintScreen.tsx
const MAX_COMPLAINT_PHOTOS = 3;

// Matches MAX_RESOLUTION_PHOTOS in Frontendui/src/screens/RiderJobDetailScreen.tsx
const MAX_RESOLUTION_PHOTOS = 5;

// verifyClient runs first so req.body/req.files are all client-authored before
// the controller reads the authenticated clientId back out of res.locals.
router.post("/", verifyClient, upload.array("photos", MAX_COMPLAINT_PHOTOS), createComplaint);
// Registered before "/:id" (admin) so "mine", "mine/active", "mine/payments"
// and "mine/:id" aren't swallowed by it.
router.get("/mine", verifyClient, getMyComplaints);
router.get("/mine/active", verifyClient, getMyActiveComplaint);
router.get("/mine/payments", verifyClient, getMyPaymentHistory);
router.get("/mine/:id", verifyClient, getMyComplaint);
router.get("/mine/:id/tracking", verifyClient, getMyComplaintTracking);
// Rider-driven job actions — ownership (assignedTo === the calling rider) is
// enforced in Complaint.advanceRiderJobStage / submitRiderResolution.
router.patch("/:id/stage", verifyRider, advanceMyJobStage);
router.post(
  "/:id/resolve",
  verifyRider,
  upload.array("photos", MAX_RESOLUTION_PHOTOS),
  submitMyJobResolution,
);
router.get("/", verifyAdmin, getAllComplaints);
router.get("/:id", verifyAdmin, getComplaint);
router.patch("/:id", verifyAdmin, updateComplaint);

export default router;
