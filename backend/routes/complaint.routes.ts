import { Router } from "express";

import {
  createComplaint,
  getAllComplaints,
  getComplaint,
  updateComplaint,
} from "../controller/complaint.controller";
import { upload } from "../middleware/cloudinary";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyClient } from "../middleware/verifyClient";

const router = Router();

// Matches MAX_IMAGES in Frontendui/src/screens/NewComplaintScreen.tsx
const MAX_COMPLAINT_PHOTOS = 3;

// verifyClient runs first so req.body/req.files are all client-authored before
// the controller reads the authenticated clientId back out of res.locals.
router.post("/", verifyClient, upload.array("photos", MAX_COMPLAINT_PHOTOS), createComplaint);
router.get("/", verifyAdmin, getAllComplaints);
router.get("/:id", verifyAdmin, getComplaint);
router.patch("/:id", verifyAdmin, updateComplaint);

export default router;
