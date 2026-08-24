import type { Request, Response } from "express";
import { isValidObjectId, mongo } from "mongoose";
import { ZodError } from "zod";

import { Rider } from "../model/rider.model";
import { createRiderSchema, listRidersQuerySchema } from "../schemas/rider.zod";

function isDuplicateUsernameError(error: unknown): boolean {
  return (
    error instanceof mongo.MongoServerError &&
    error.code === 11000 &&
    Object.keys(error.keyPattern ?? {}).includes("username")
  );
}

export async function createRider(req: Request, res: Response) {
  try {
    const input = createRiderSchema.parse(req.body);
    const rider = await Rider.createRider(input);
    res.status(201).json({ success: true, rider });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    if (isDuplicateUsernameError(error)) {
      res
        .status(409)
        .json({ success: false, message: "Username already taken", errors: { username: ["Username already taken"] } });
      return;
    }
    console.error("Failed to create rider:", error);
    res.status(500).json({ success: false, message: "Failed to create rider" });
  }
}

export async function getAllRiders(req: Request, res: Response) {
  try {
    const { page, search } = listRidersQuerySchema.parse(req.query);
    const result = await Rider.getAllRiders(page, search);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid query", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to fetch riders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch riders" });
  }
}

export async function getRider(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid rider id" });
      return;
    }

    const rider = await Rider.getRiderById(id);
    if (!rider) {
      res.status(404).json({ success: false, message: "Rider not found" });
      return;
    }

    res.status(200).json({ success: true, rider });
  } catch (error) {
    console.error("Failed to fetch rider:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rider" });
  }
}

export async function getRiderStats(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid rider id" });
      return;
    }

    const stats = await Rider.getOrderStats(id);
    if (!stats) {
      res.status(404).json({ success: false, message: "Rider not found" });
      return;
    }

    res.status(200).json({ success: true, ...stats });
  } catch (error) {
    console.error("Failed to fetch rider stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rider stats" });
  }
}

export async function getRiderTracking(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid rider id" });
      return;
    }

    const tracking = await Rider.getTracking(id);
    if (!tracking) {
      res.status(404).json({ success: false, message: "Rider not found" });
      return;
    }

    res.status(200).json({ success: true, ...tracking });
  } catch (error) {
    console.error("Failed to fetch rider tracking:", error);
    res.status(500).json({ success: false, message: "Failed to fetch rider tracking" });
  }
}
