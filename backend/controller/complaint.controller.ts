import type { Request, Response } from "express";
import { ZodError } from "zod";

import { uploadBufferToCloudinary } from "../middleware/cloudinary";
import { Complaint } from "../model/complaint.model";
import {
  createComplaintSchema,
  listComplaintsQuerySchema,
  submitResolutionSchema,
  updateComplaintSchema,
} from "../schemas/complaint.zod";

export async function createComplaint(req: Request, res: Response) {
  try {
    const input = createComplaintSchema.parse(req.body);
    const clientId = res.locals.clientId as string;

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const photos = await Promise.all(
      files.map((file) => uploadBufferToCloudinary(file.buffer, "complaints")),
    );

    const complaint = await Complaint.createComplaint(clientId, input, photos);
    if (!complaint) {
      res.status(404).json({ success: false, message: "Client not found" });
      return;
    }

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to create complaint:", error);
    res.status(500).json({ success: false, message: "Failed to create complaint" });
  }
}

export async function getMyComplaints(req: Request, res: Response) {
  try {
    const { page } = listComplaintsQuerySchema.pick({ page: true }).parse(req.query);
    const clientId = res.locals.clientId as string;
    const result = await Complaint.getComplaintsForClient(clientId, page);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid query", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to fetch complaints:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
}

export async function getMyActiveComplaint(req: Request, res: Response) {
  try {
    const clientId = res.locals.clientId as string;
    const complaint = await Complaint.getActiveComplaintForClient(clientId);
    res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error("Failed to fetch active complaint:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active complaint" });
  }
}

export async function getMyComplaint(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const clientId = res.locals.clientId as string;
    const complaint = await Complaint.getComplaintForClient(id, clientId);
    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error("Failed to fetch complaint:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint" });
  }
}

export async function getMyComplaintTracking(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const clientId = res.locals.clientId as string;
    const tracking = await Complaint.getTrackingForClient(id, clientId);
    if (!tracking) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    res.status(200).json({ success: true, ...tracking });
  } catch (error) {
    console.error("Failed to fetch complaint tracking:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint tracking" });
  }
}

function riderJobActionErrorResponse(res: Response, outcome: "not-found" | "forbidden" | "invalid-transition") {
  if (outcome === "not-found") {
    res.status(404).json({ success: false, message: "Job not found" });
    return;
  }
  if (outcome === "forbidden") {
    res.status(403).json({ success: false, message: "This job isn't assigned to you" });
    return;
  }
  res.status(409).json({ success: false, message: "Job can't be advanced from its current status" });
}

export async function advanceMyJobStage(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const riderId = res.locals.riderId as string;
    const result = await Complaint.advanceRiderJobStage(id, riderId);
    if (result.outcome !== "ok") {
      riderJobActionErrorResponse(res, result.outcome);
      return;
    }

    res.status(200).json({ success: true, complaint: result.complaint });
  } catch (error) {
    console.error("Failed to advance job stage:", error);
    res.status(500).json({ success: false, message: "Failed to advance job stage" });
  }
}

export async function submitMyJobResolution(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const { notes } = submitResolutionSchema.parse(req.body);
    const riderId = res.locals.riderId as string;

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const photos = await Promise.all(
      files.map((file) => uploadBufferToCloudinary(file.buffer, "resolutions")),
    );

    const result = await Complaint.submitRiderResolution(id, riderId, { notes, photos });
    if (result.outcome !== "ok") {
      riderJobActionErrorResponse(res, result.outcome);
      return;
    }

    res.status(200).json({ success: true, complaint: result.complaint });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to submit job resolution:", error);
    res.status(500).json({ success: false, message: "Failed to submit job resolution" });
  }
}

export async function getAllComplaints(req: Request, res: Response) {
  try {
    const { page, search, bucket, riderId } = listComplaintsQuerySchema.parse(req.query);
    const result = await Complaint.getAllComplaints(page, { search, bucket, riderId });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid query", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to fetch complaints:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
}

export async function getComplaint(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const complaint = await Complaint.getComplaintById(id);
    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    console.error("Failed to fetch complaint:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint" });
  }
}

export async function updateComplaint(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Invalid complaint id" });
      return;
    }

    const input = updateComplaintSchema.parse(req.body);
    const adminId = req.body.id as string;

    const result = await Complaint.updateComplaint(id, adminId, input);
    if (result.outcome === "not-found") {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }
    if (result.outcome === "rider-not-found") {
      res.status(404).json({ success: false, message: "Rider not found" });
      return;
    }
    if (result.outcome === "too-many-unpaid") {
      res.status(409).json({
        success: false,
        message: `This client already has ${result.unpaidCount} other unpaid complaints — settle those before adding a new charge.`,
      });
      return;
    }
    if (result.outcome === "unpaid-balance") {
      res.status(409).json({
        success: false,
        message: "This complaint still has an unpaid balance — mark it Paid before resolving.",
      });
      return;
    }

    res.status(200).json({ success: true, complaint: result.complaint });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to update complaint:", error);
    res.status(500).json({ success: false, message: "Failed to update complaint" });
  }
}
