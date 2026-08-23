import { Router } from "express";

import { createRider, getAllRiders, getRider } from "../controller/rider.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = Router();

router.post("/", verifyAdmin, createRider);
router.get("/", verifyAdmin, getAllRiders);
router.get("/:id", verifyAdmin, getRider);

export default router;
