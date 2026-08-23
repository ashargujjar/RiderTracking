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
