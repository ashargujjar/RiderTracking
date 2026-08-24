import { Router } from "express";

import {
  createRider,
  getAllRiders,
  getRider,
  getRiderStats,
  getRiderTracking,
} from "../controller/rider.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = Router();

router.post("/", verifyAdmin, createRider);
router.get("/", verifyAdmin, getAllRiders);
router.get("/:id", verifyAdmin, getRider);
router.get("/:id/tracking", verifyAdmin, getRiderTracking);
router.get("/:id/stats", verifyAdmin, getRiderStats);

export default router;
