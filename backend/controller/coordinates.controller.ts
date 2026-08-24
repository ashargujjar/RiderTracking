import type { Request, Response } from "express";
import { ZodError } from "zod";

import { Coordinates } from "../model/coordinates.model";
import { upsertCoordinatesSchema } from "../schemas/coordinates.zod";

export async function getMyCoordinates(req: Request, res: Response) {
  try {
    const clientId = res.locals.clientId as string;

    const coordinates = await Coordinates.getByClientId(clientId);
    if (!coordinates) {
      res.status(404).json({ success: false, message: "No saved location for this client" });
      return;
    }

    res.status(200).json({ success: true, coordinates });
  } catch (error) {
    console.error("Failed to fetch coordinates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch coordinates" });
  }
}

export async function upsertMyCoordinates(req: Request, res: Response) {
  try {
    const input = upsertCoordinatesSchema.parse(req.body);
    const clientId = res.locals.clientId as string;

    const coordinates = await Coordinates.upsertForClient(clientId, input);
    res.status(200).json({ success: true, coordinates });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to save coordinates:", error);
    res.status(500).json({ success: false, message: "Failed to save coordinates" });
  }
}
