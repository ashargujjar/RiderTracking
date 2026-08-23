import { Router } from "express";

import { login } from "../controller/admin.controller";

const router = Router();

router.post("/login", login);

export default router;