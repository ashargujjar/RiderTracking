import { Router } from "express";

import {
  createClient,
  deleteClient,
  editClient,
  getAllClients,
  getClient,
  getClientStats,
  login,
  updateMyPushToken,
} from "../controller/client.controller";
import { loginRateLimit } from "../middleware/loginRateLimit";
import { verifyAdmin } from "../middleware/verifyAdmin";
import { verifyClient } from "../middleware/verifyClient";

const router = Router();

router.post("/login", loginRateLimit, login);
router.put("/me/push-token", verifyClient, updateMyPushToken);
router.post("/", verifyAdmin, createClient);
router.get("/", verifyAdmin, getAllClients);
router.get("/:id", verifyAdmin, getClient);
router.get("/:id/stats", verifyAdmin, getClientStats);
router.put("/:id", verifyAdmin, editClient);
router.delete("/:id", verifyAdmin, deleteClient);

export default router;