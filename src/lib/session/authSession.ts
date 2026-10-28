/**
 * The signed-in session, stored on this device.
 *
 * The ONLY file that knows the localStorage keys for the access token and the signed-in user.
 * Everything else calls these functions. Never read or write these keys anywhere else.
 */

export type UserRole = "PATIENT" | "DOCTOR";

/** What we keep about the signed-in person between page loads. */
export type SessionUser = {
  userId: number | null;
  role: UserRole;
  fullName: string;
  mobile: string;
};

const STORAGE_KEYS = {
  accessToken: "medistry_auth_token",
  refreshToken: "medistry_refresh_token",
  user: "medistry_user",
} as const;

const isBrowser = () => typeof window !== "undefined";

/** Reads the role and name the backend put inside the JWT. Returns {} if the token is not a JWT. */
function decodeTokenPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function isSignedIn(): boolean {
  return Boolean(getAccessToken());
}

/**
 * Saves the session after OTP verification. The role comes from the JWT (the backend's source of
 * truth); the user object from the response fills in the name.
 */
export function saveSession(params: {
  accessToken: string;
  refreshToken?: string | null;
  mobile: string;
  user?: { id?: number | string; userId?: number | string; fullName?: string; name?: string } | null;
}): SessionUser {
  const claims = decodeTokenPayload(params.accessToken);
  const role: UserRole = String(claims.role ?? "").toUpperCase() === "DOCTOR" ? "DOCTOR" : "PATIENT";
  const rawId = params.user?.userId ?? params.user?.id ?? claims.userId ?? claims.id ?? claims.sub;
  const sessionUser: SessionUser = {
    userId: rawId != null && !Number.isNaN(Number(rawId)) ? Number(rawId) : null,
    role,
    fullName: String(params.user?.fullName ?? params.user?.name ?? claims.name ?? claims.fullName ?? ""),
    mobile: params.mobile,
  };

  localStorage.setItem(STORAGE_KEYS.accessToken, params.accessToken);
  if (params.refreshToken) localStorage.setItem(STORAGE_KEYS.refreshToken, params.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(sessionUser));
  return sessionUser;
}

/** Updates the stored name, e.g. after onboarding or a profile edit. */
export function updateSessionUser(changes: Partial<SessionUser>) {
  const current = getSessionUser();
  if (!current) return;
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify({ ...current, ...changes }));
}

export function clearSession() {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

/** Where a signed-in person lands. */
export function homePathFor(role: UserRole) {
  return role === "DOCTOR" ? "/doctor-dashboard" : "/dashboard";
}
