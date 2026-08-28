import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { ZodError } from "zod";

import { GuideVideo } from "../model/guideVideo.model";
import {
  createGuideVideoSchema,
  editGuideVideoSchema,
  listGuideVideosQuerySchema,
} from "../schemas/guideVideo.zod";

export async function createGuideVideo(req: Request, res: Response) {
  try {
    const input = createGuideVideoSchema.parse(req.body);
    const video = await GuideVideo.createVideo(input);
    res.status(201).json({ success: true, video });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to create guide video:", error);
    res.status(500).json({ success: false, message: "Failed to create guide video" });
  }
}

export async function getAllGuideVideos(req: Request, res: Response) {
  try {
    const { page } = listGuideVideosQuerySchema.parse(req.query);
    const result = await GuideVideo.getAllVideos(page);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid query", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to fetch guide videos:", error);
    res.status(500).json({ success: false, message: "Failed to fetch guide videos" });
  }
}

export async function getGuideVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid video id" });
      return;
    }

    const video = await GuideVideo.getVideoById(id);
    if (!video) {
      res.status(404).json({ success: false, message: "Video not found" });
      return;
    }

    res.status(200).json({ success: true, video });
  } catch (error) {
    console.error("Failed to fetch guide video:", error);
    res.status(500).json({ success: false, message: "Failed to fetch guide video" });
  }
}

export async function editGuideVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid video id" });
      return;
    }

    const input = editGuideVideoSchema.parse(req.body);
    const updatedVideo = await GuideVideo.editVideo(id, input);
    if (!updatedVideo) {
      res.status(404).json({ success: false, message: "Video not found" });
      return;
    }

    res.status(200).json({ success: true, video: updatedVideo });
  } catch (error) {
    if (error instanceof ZodError) {
      res
        .status(400)
        .json({ success: false, message: "Invalid input", errors: error.flatten().fieldErrors });
      return;
    }
    console.error("Failed to edit guide video:", error);
    res.status(500).json({ success: false, message: "Failed to edit guide video" });
  }
}

export async function deleteGuideVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      res.status(400).json({ success: false, message: "Invalid video id" });
      return;
    }

    const deletedVideo = await GuideVideo.deleteVideo(id);
    if (!deletedVideo) {
      res.status(404).json({ success: false, message: "Video not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Video deleted successfully", video: deletedVideo });
  } catch (error) {
    console.error("Failed to delete guide video:", error);
    res.status(500).json({ success: false, message: "Failed to delete guide video" });
  }
}
