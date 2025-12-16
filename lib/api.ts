export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nba_token");
}

export function setToken(token: string) {
  localStorage.setItem("nba_token", token);
}

export function clearToken() {
  localStorage.removeItem("nba_token");
}

export async function apiGet(path: string) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function apiPostJson(path: string, body: unknown) {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPostForm(path: string, form: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) params.set(k, v);

  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
}
