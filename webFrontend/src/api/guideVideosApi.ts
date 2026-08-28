import { apiFetch } from "./client";

export type GuideVideo = {
  _id: string;
  title: string;
  description?: string;
  link: string;
  createdAt: string;
};

export type CreateGuideVideoPayload = {
  title: string;
  description?: string;
  link: string;
};

export type EditGuideVideoPayload = Partial<CreateGuideVideoPayload>;

export type GuideVideosPage = {
  videos: GuideVideo[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export async function getGuideVideos(page: number): Promise<GuideVideosPage> {
  return apiFetch<{ success: boolean } & GuideVideosPage>(`/guide-videos?page=${page}`);
}

export async function createGuideVideo(payload: CreateGuideVideoPayload): Promise<GuideVideo> {
  const data = await apiFetch<{ success: boolean; video: GuideVideo }>("/guide-videos", {
    method: "POST",
    body: payload,
  });
  return data.video;
}

export async function editGuideVideo(id: string, payload: EditGuideVideoPayload): Promise<GuideVideo> {
  const data = await apiFetch<{ success: boolean; video: GuideVideo }>(`/guide-videos/${id}`, {
    method: "PUT",
    body: payload,
  });
  return data.video;
}

export async function deleteGuideVideo(id: string): Promise<void> {
  await apiFetch(`/guide-videos/${id}`, { method: "DELETE" });
}
