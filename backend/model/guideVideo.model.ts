import { GuideVideo as GuideVideoSchema } from "../schemas/guideVideo.schema";
import type { CreateGuideVideoInput, EditGuideVideoInput } from "../schemas/guideVideo.zod";

const GUIDE_VIDEOS_PAGE_SIZE = 10;

export class GuideVideo {
  static async createVideo(input: CreateGuideVideoInput) {
    const video = await GuideVideoSchema.create(input);
    return video.toObject();
  }

  static async getAllVideos(page: number) {
    const skip = (page - 1) * GUIDE_VIDEOS_PAGE_SIZE;

    const [videos, totalCount] = await Promise.all([
      GuideVideoSchema.find().sort({ createdAt: -1 }).skip(skip).limit(GUIDE_VIDEOS_PAGE_SIZE).lean(),
      GuideVideoSchema.countDocuments(),
    ]);

    return {
      videos,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(totalCount / GUIDE_VIDEOS_PAGE_SIZE)),
      totalCount,
    };
  }

  static async getVideoById(id: string) {
    return GuideVideoSchema.findById(id).lean();
  }

  static async editVideo(id: string, input: EditGuideVideoInput) {
    const video = await GuideVideoSchema.findById(id);
    if (!video) return null;

    video.set(input);
    await video.save();
    return video.toObject();
  }

  static async deleteVideo(id: string) {
    const video = await GuideVideoSchema.findById(id);
    if (!video) return null;

    await video.deleteOne();
    return video.toObject();
  }
}
