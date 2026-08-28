import { Router } from "express";

import {
  createRider,
  getAllRiders,
  getMyQueue,
  getRider,
  getRiderStats,
  getRiderTracking,
  login,
} from "../controller/rider.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyRider } from "../middleware/verifyRider";

const router = Router();

router.post("/login", login);
// Registered before "/:id" (admin) so "mine/queue" isn't swallowed by it.
router.get("/mine/queue", verifyRider, getMyQueue);
router.post("/", verifyAdmin, createRider);
router.get("/", verifyAdmin, getAllRiders);
router.get("/:id", verifyAdmin, getRider);
router.get("/:id/tracking", verifyAdmin, getRiderTracking);
router.get("/:id/stats", verifyAdmin, getRiderStats);

export default router;
