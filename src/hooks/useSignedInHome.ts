"use client";

/** The signed-in person's home (the doctor or patient dashboard), or null when signed out or before hydration. */

import { homePathFor } from "@/lib/session/authSession";
import { useSessionUser } from "./useSessionUser";

export function useSignedInHome(): string | null {
  const { status } = useSessionUser();
  return status && status !== "OUT" ? homePathFor(status) : null;
}
