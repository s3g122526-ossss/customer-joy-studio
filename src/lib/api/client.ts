/**
 * ============================================================================
 * KENNEDY MOON GRILL — HTTP CLIENT FOR THE DJANGO BACKEND
 * ============================================================================
 *
 * BACKEND DEVELOPER: this is the single door between the React app and Django.
 * Nothing else in the UI calls `fetch()` — swap the local stubs listed in
 * `src/lib/api/endpoints.ts` for `api.get/post/patch` calls and the whole app
 * is live.
 *
 * ENVIRONMENT
 *   VITE_API_BASE_URL   e.g. https://api.moongrill.pk/api/v1   (no trailing /)
 *   VITE_API_AUTH_MODE  "jwt" (default, SimpleJWT) | "session" (Django session
 *                       + CSRF cookie, requires CORS_ALLOW_CREDENTIALS = True)
 *
 * DJANGO EXPECTATIONS
 *   - DRF with `rest_framework_simplejwt` → POST /auth/token/ {access, refresh}
 *   - CORS: django-cors-headers, allow the preview + published origins
 *   - Errors: DRF style `{ "detail": "..." }` or `{ "field": ["msg"] }`
 *   - Pagination: DRF PageNumberPagination `{count, next, previous, results}`
 */

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export const AUTH_MODE: "jwt" | "session" =
  (import.meta.env["VITE_API_AUTH_MODE"] as "jwt" | "session" | undefined) ?? "jwt";

/** True once the backend URL is configured — the UI stays on local stubs until then. */
export const isBackendConfigured = () => API_BASE_URL.length > 0;

const ACCESS_KEY = "kmg.api.access";
const REFRESH_KEY = "kmg.api.refresh";

export const tokens = {
  access: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  refresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  set(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/** Django sets `csrftoken` when AUTH_MODE === "session". */
function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie.split("; ").find((c) => c.startsWith("csrftoken="));
  return hit ? decodeURIComponent(hit.slice("csrftoken=".length)) : null;
}

export class ApiError extends Error {
  status: number;
  /** DRF field errors, e.g. { email: ["Already registered"] } */
  fields: Record<string, string[]>;
  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type Options = { query?: Record<string, string | number | boolean | undefined>; signal?: AbortSignal };

async function request<T>(method: string, path: string, body?: unknown, options: Options = {}): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError(0, "VITE_API_BASE_URL is not set — the app is running on local demo data.");
  }

  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(options.query ?? {}).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });

  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (AUTH_MODE === "jwt") {
    const access = tokens.access();
    if (access) headers["Authorization"] = `Bearer ${access}`;
  } else {
    const csrf = csrfToken();
    if (csrf) headers["X-CSRFToken"] = csrf;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    credentials: AUTH_MODE === "session" ? "include" : "same-origin",
    ...(body === undefined ? {} : { body: isForm ? (body as FormData) : JSON.stringify(body) }),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (res.status === 204) return undefined as T;

  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const record = (payload ?? {}) as Record<string, unknown>;
    const detail = typeof record["detail"] === "string" ? (record["detail"] as string) : null;
    const fields: Record<string, string[]> = {};
    Object.entries(record).forEach(([key, value]) => {
      if (key !== "detail" && Array.isArray(value)) fields[key] = value.map(String);
    });
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`, fields);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: Options) => request<T>("POST", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: Options) => request<T>("PATCH", path, body, options),
  put: <T>(path: string, body?: unknown, options?: Options) => request<T>("PUT", path, body, options),
  delete: <T>(path: string, options?: Options) => request<T>("DELETE", path, undefined, options),
};
