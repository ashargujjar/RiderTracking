import { apiFetch } from "./client";

export type Stats = {
  totalClients: number;
  totalRiders: number;
  pendingComplaints: number;
};

export async function getStats(): Promise<Stats> {
  const data = await apiFetch<{ success: boolean } & Stats>("/stats");
  return {
    totalClients: data.totalClients,
    totalRiders: data.totalRiders,
    pendingComplaints: data.pendingComplaints,
  };
}
