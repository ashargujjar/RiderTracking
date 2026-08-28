import { Router } from "express";

import {
  createRider,
  getAllRiders,
  getMyQueue,
  getRider,
  getRiderStats,
  getRiderTracking,
  login,
  updateMyLocation,
} from "../controller/rider.controller";
import { loginRateLimit } from "../middleware/loginRateLimit";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyRider } from "../middleware/verifyRider";

const router = Router();

router.post("/login", loginRateLimit, login);
// Registered before "/:id" (admin) so "mine/queue" and "mine/location" aren't swallowed by it.
router.get("/mine/queue", verifyRider, getMyQueue);
router.put("/mine/location", verifyRider, updateMyLocation);
router.post("/", verifyAdmin, createRider);
router.get("/", verifyAdmin, getAllRiders);
router.get("/:id", verifyAdmin, getRider);
router.get("/:id/tracking", verifyAdmin, getRiderTracking);
router.get("/:id/stats", verifyAdmin, getRiderStats);

export default router;
