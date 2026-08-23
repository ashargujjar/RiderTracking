import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";

import { Admin } from "../model/admin.model";
import { loginSchema } from "../schemas/admin.zod";

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const admin = await Admin.login(username, password);
    if (!admin) {
      res.status(401).json({ success: false, message: "Invalid username or password" });
      return;
    }

    const token = jwt.sign(
      { id: admin._id.toString(), role: "admin" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Admin login failed:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
}