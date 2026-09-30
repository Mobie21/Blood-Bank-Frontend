// Client for the standalone Express backend in server/.
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";

const TOKENS_KEY = "haemocentral.tokens";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

export function getTokens(): Tokens | null {
  try {
    const raw = sessionStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function setTokens(t: Tokens | null) {
  if (t) sessionStorage.setItem(TOKENS_KEY, JSON.stringify(t));
  else sessionStorage.removeItem(TOKENS_KEY);
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function refresh(): Promise<boolean> {
  const t = getTokens();
  if (!t) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: t.refresh_token }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { access_token: string };
  setTokens({ ...t, access_token: data.access_token });
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const t = getTokens();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t.access_token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(
      `Cannot reach the server at ${API_URL}. Make sure the backend is running.`,
      0,
    );
  }
  if (res.status === 401 && retry && t && !path.startsWith("/auth/login")) {
    if (await refresh()) return api<T>(path, init, false);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { error?: { message?: string }; message?: string }).error?.message ??
      (body as { message?: string }).message ??
      `Request failed (${res.status})`;
    throw new ApiRequestError(msg, res.status);
  }
  return body as T;
}
