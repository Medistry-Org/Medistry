"use client";

/**
 * Who is signed in on this device: status "OUT", "PATIENT" or "DOCTOR", and the stored user. Both
 * are null on the server and in the first paint (the session lives in this browser), so the two agree.
 * A token without a stored user counts as a patient, the backend's default role.
 */

import { useSyncExternalStore } from "react";
import { getSessionUser, isSignedIn } from "@/lib/session/authSession";

type SessionStatus = "OUT" | "PATIENT" | "DOCTOR";

const subscribeToNothing = () => () => {};

function readStatus(): SessionStatus {
  return isSignedIn() ? (getSessionUser()?.role ?? "PATIENT") : "OUT";
}

export function useSessionUser() {
  const status = useSyncExternalStore<SessionStatus | null>(
    subscribeToNothing,
    readStatus,
    () => null,
  );
  const user = status && status !== "OUT" ? getSessionUser() : null;
  return { status, user };
}
