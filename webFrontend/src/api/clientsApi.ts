import { apiFetch } from "./client";

export type ApiClientDoc = {
  _id: string;
  client: Record<string, unknown>;
  wiring: Record<string, unknown>;
  panel: Record<string, unknown>;
  battery: Record<string, unknown>;
  inverter: Record<string, unknown>;
  structure: Record<string, unknown>;
  qc: Record<string, unknown>;
  remarks: Record<string, unknown>;
  whatsappSent?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientPayload = Record<string, Record<string, string>>;

export async function createClient(payload: ClientPayload): Promise<ApiClientDoc> {
  const data = await apiFetch<{ success: boolean; client: ApiClientDoc }>("/clients", {
    method: "POST",
    body: payload,
  });
  return data.client;
}

export type ClientsPage = {
  clients: ApiClientDoc[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export async function getClients(page: number, search?: string): Promise<ClientsPage> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);

  const data = await apiFetch<{
    success: boolean;
    clients: ApiClientDoc[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }>(`/clients?${params.toString()}`);
  return {
    clients: data.clients,
    currentPage: data.currentPage,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
  };
}

export async function getClientById(id: string): Promise<ApiClientDoc> {
  const data = await apiFetch<{ success: boolean; client: ApiClientDoc }>(`/clients/${id}`);
  return data.client;
}

export async function updateClient(id: string, payload: ClientPayload): Promise<ApiClientDoc> {
  const data = await apiFetch<{ success: boolean; client: ApiClientDoc }>(`/clients/${id}`, {
    method: "PUT",
    body: payload,
  });
  return data.client;
}

export async function deleteClient(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/clients/${id}`, { method: "DELETE" });
}
