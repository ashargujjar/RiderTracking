import { Router } from "express";

import { getStats } from "../controller/stats.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = Router();

router.get("/", verifyAdmin, getStats);

export default router;
1;
