import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type RiderTokenPayload = {
  id: string;
  role: string;
};

export function verifyRider(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as RiderTokenPayload;

    if (decoded.role !== "rider") {
      res.status(403).json({ success: false, message: "Rider access required" });
      return;
    }

    res.locals.riderId = decoded.id;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
