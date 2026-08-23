import type { Request, Response } from "express";

import { Stats } from "../model/stats.model";

export async function getStats(_req: Request, res: Response) {
  try {
    const counts = await Stats.getCounts();
    res.status(200).json({ success: true, ...counts });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}
