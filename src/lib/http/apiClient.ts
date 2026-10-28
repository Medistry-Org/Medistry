/**
 * The HTTP client for the Medistry backend.
 *
 * The ONLY file that calls fetch(). Services in src/services/ call apiRequest(); pages and
 * components call services. This keeps the base URL, auth header and error handling in one place.
 *
 * The backend answers `{ success, message, data }`. apiRequest returns the whole parsed body
 * (some endpoints put fields beside `data`, e.g. `sessionId`), and throws ApiError when the
 * HTTP status is not 2xx or `success` is false.
 */

import { API_BASE_URL } from "@/config/env";
import { clearSession, getAccessToken } from "@/lib/session/authSession";

/** The usual backend response shape. Endpoints may add extra top-level fields. */
export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** True when the endpoint does not exist yet on the backend (see docs/backend/). */
  get isMissingEndpoint() {
    return this.status === 404;
  }

  get isUnauthorised() {
    return this.status === 401;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** A plain object is sent as JSON; FormData is sent as multipart (file uploads). */
  body?: unknown;
  /** Query string values; undefined and empty values are skipped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send the access token. Default true. */
  authenticated?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function messageFrom(body: unknown, status: number) {
  if (body && typeof body === "object") {
    const b = body as { message?: unknown; error?: unknown };
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.error === "string" && b.error) return b.error;
  }
  // a short plain-text reason is shown; an HTML error page (e.g. Express "Cannot GET") never is
  if (typeof body === "string" && body && body.length < 200 && !body.trimStart().startsWith("<")) return body;
  if (status === 404) return "This feature is not available yet.";
  if (status === 401) return "Your session has ended. Please sign in again.";
  return "Something went wrong. Please try again.";
}

export async function apiRequest<TBody = ApiEnvelope<unknown>>(path: string, options: RequestOptions = {}): Promise<TBody> {
  const { method = "GET", body, query, authenticated = true, signal } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  const token = authenticated ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch (networkError) {
    if ((networkError as Error).name === "AbortError") throw networkError;
    throw new ApiError("Cannot reach Medistry. Check your connection and try again.", 0, null);
  }

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  const failedBySuccessFlag = parsed !== null && typeof parsed === "object" && (parsed as ApiEnvelope<unknown>).success === false;
  if (!response.ok || failedBySuccessFlag) {
    if (response.status === 401 && token) clearSession();
    throw new ApiError(messageFrom(parsed, response.status), response.status, parsed);
  }
  return parsed as TBody;
}

/** Turns any thrown value into a sentence a patient or doctor can read. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError || error instanceof Error) return error.message || fallback;
  return fallback;
}

/**
 * Many list endpoints answer either `[...]`, `{ data: [...] }` or `{ data: { <key>: [...] } }`.
 * Returns the array wherever it is, or [] if there is none.
 */
export function listFrom<T>(body: unknown, nestedKey?: string): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const data = (body as ApiEnvelope<unknown>).data;
    if (Array.isArray(data)) return data as T[];
    if (nestedKey && data && typeof data === "object") {
      const nested = (data as Record<string, unknown>)[nestedKey];
      if (Array.isArray(nested)) return nested as T[];
    }
    if (nestedKey) {
      const topLevel = (body as Record<string, unknown>)[nestedKey];
      if (Array.isArray(topLevel)) return topLevel as T[];
    }
  }
  return [];
}
