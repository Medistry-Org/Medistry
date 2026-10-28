"use client";

/*
  The doctor shell's Sign out, a quiet text button under the doctor's name on the rail and in the
  phone top bar (where Arhaan's prototype keeps its small account control). It signs out through useSignOut:
  the server, then this device, then sign-in.
*/

import { SignOut } from "@phosphor-icons/react";
import { useSignOut } from "@/hooks/useSignOut";

export default function SignOutButton({ className }: { className: string }) {
  const { signOut, leaving } = useSignOut();

  return (
    <button
      type="button"
      className={className}
      disabled={leaving}
      onClick={signOut}
    >
      <SignOut size={16} aria-hidden="true" />
      {leaving ? "Signing out" : "Sign out"}
    </button>
  );
}
