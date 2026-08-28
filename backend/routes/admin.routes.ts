import { Router } from "express";

import { login } from "../controller/admin.controller";
import { loginRateLimit } from "../middleware/loginRateLimit";

const router = Router();

router.post("/login", loginRateLimit, login);

export default router;