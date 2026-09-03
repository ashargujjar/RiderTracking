import { apiFetch } from "./client";
import type { RiderCategory, RiderRecord } from "../data/mockRiders";

type ApiRiderDoc = {
  _id: string;
  name: string;
  phone: string;
  category: RiderCategory;
  username: string;
  password?: string;
};

function toRiderRecord(doc: ApiRiderDoc): RiderRecord {
  return {
    id: doc._id,
    name: doc.name,
    phone: doc.phone,
    category: doc.category,
    username: doc.username,
    password: doc.password,
  };
}

export type CreateRiderPayload = {
  name: string;
  phone: string;
  category: RiderCategory;
  username: string;
  password: string;
};

export async function createRider(payload: CreateRiderPayload): Promise<RiderRecord> {
  const data = await apiFetch<{ success: boolean; rider: ApiRiderDoc }>("/riders", {
    method: "POST",
    body: payload,
  });
  return toRiderRecord(data.rider);
}

export type RidersPage = {
  riders: RiderRecord[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export async function getRiders(page: number, search?: string): Promise<RidersPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);

  const data = await apiFetch<{
    success: boolean;
    riders: ApiRiderDoc[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }>(`/riders?${params.toString()}`);
  return {
    riders: data.riders.map(toRiderRecord),
    currentPage: data.currentPage,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
  };
}

export async function getRiderById(id: string): Promise<RiderRecord> {
  const data = await apiFetch<{ success: boolean; rider: ApiRiderDoc }>(`/riders/${id}`);
  return toRiderRecord(data.rider);
}

export type RiderTrackingJob = {
  id: string;
  title: string;
  status: string;
  raisedDate: string;
  site: string;
  coordinates: { latitude: number; longitude: number } | null;
};

export type RiderTracking = {
  location: { latitude: number; longitude: number; heading: number | null; updatedAt: string } | null;
  jobs: RiderTrackingJob[];
};

// Payload of the "rider:location" socket event emitted by
// Rider.updateMyLocation (backend/model/rider.model.ts) to the
// `location:<riderId>` room.
export type RiderLocationEvent = {
  riderId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  updatedAt: string;
};

type ApiRiderTrackingJob = Omit<RiderTrackingJob, "id"> & { id: number };

export async function getRiderTracking(id: string): Promise<RiderTracking> {
  const data = await apiFetch<{ success: boolean; location: RiderTracking["location"]; jobs: ApiRiderTrackingJob[] }>(
    `/riders/${id}/tracking`,
  );
  return {
    location: data.location,
    jobs: data.jobs.map((job) => ({ ...job, id: String(job.id) })),
  };
}

export type RiderOrderStats = {
  assignedCount: number;
  totalCompletedCount: number;
  monthlyCompletedCount: number;
  previousMonthCompletedCount: number;
};

export async function getRiderStats(id: string): Promise<RiderOrderStats> {
  const data = await apiFetch<{ success: boolean } & RiderOrderStats>(`/riders/${id}/stats`);
  return {
    assignedCount: data.assignedCount,
    totalCompletedCount: data.totalCompletedCount,
    monthlyCompletedCount: data.monthlyCompletedCount,
    previousMonthCompletedCount: data.previousMonthCompletedCount,
  };
}
