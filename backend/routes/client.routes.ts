import { Router } from "express";

import { createClient, deleteClient, editClient, getAllClients, getClient } from "../controller/client.controller";
import { verifyAdmin } from "../middleware/verifyAdmin";

const router = Router();

router.post("/", verifyAdmin, createClient);
router.get("/", verifyAdmin, getAllClients);
router.get("/:id", verifyAdmin, getClient);
router.put("/:id", verifyAdmin, editClient);
router.delete("/:id", verifyAdmin, deleteClient);

export default router;