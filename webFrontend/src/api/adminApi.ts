import { apiFetch } from "./client";

export async function loginAdmin(username: string, password: string): Promise<string> {
  const data = await apiFetch<{ success: boolean; token: string }>("/admin/login", {
    method: "POST",
    body: { username, password },
  });
  return data.token;
}
