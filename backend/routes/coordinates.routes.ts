import { Router } from "express";

import { getMyCoordinates, upsertMyCoordinates } from "../controller/coordinates.controller";
import { verifyClient } from "../middleware/verifyClient";

const router = Router();

router.get("/", verifyClient, getMyCoordinates);
router.put("/", verifyClient, upsertMyCoordinates);

export default router;
