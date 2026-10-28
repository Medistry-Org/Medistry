"use client";

/**
 * Signing out, the same for both dashboards: end the session on the server (POST /api/auth/logout
 * via authService), then on this device, then land on sign-in. `leaving` is true while it runs.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session/authSession";
import { logout } from "@/services/authService";

export function useSignOut() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const signOut = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      // the server session may already be gone; this device signs out either way
    }
    clearSession();
    router.replace("/sign-in?out=1");
  };

  return { signOut, leaving };
}
