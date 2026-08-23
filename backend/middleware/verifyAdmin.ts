import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type AdminTokenPayload = {
  id: string;
  role: string;
};

export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AdminTokenPayload;

    if (decoded.role !== "admin") {
      res.status(403).json({ success: false, message: "Admin access required" });
      return;
    }

    req.body.id = decoded.id;
    req.body.role = decoded.role;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}