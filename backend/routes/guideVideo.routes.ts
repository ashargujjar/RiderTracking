import { Router } from "express";

import {
  createGuideVideo,
  deleteGuideVideo,
  editGuideVideo,
  getAllGuideVideos,
  getGuideVideo,
} from "../controller/guideVideo.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = Router();

// Listing is public (no sensitive data) so both the admin dashboard and the
// client mobile app's Demo Guide screen can read it without separate auth.
router.get("/", getAllGuideVideos);
router.get("/:id", getGuideVideo);
router.post("/", verifyAdmin, createGuideVideo);
router.put("/:id", verifyAdmin, editGuideVideo);
router.delete("/:id", verifyAdmin, deleteGuideVideo);

export default router;
