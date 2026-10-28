"use client";

/*
  The foot of Profile (Arhaan Profile.tsx): sign out asks once, in place, then ends the session on
  the server and on this device and goes to the homepage. The version sits under it.
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { clearSession } from "@/lib/session/authSession";
import { logout } from "@/services/authService";
import styles from "./Profile.module.css";

const VERSION = "0.9";

export default function SignOutFoot() {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const signOut = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      // the server session may already be gone; this device signs out either way
    }
    clearSession();
    router.replace("/");
  };

  return (
    <div className={styles.foot}>
      {asking ? (
        <div className={styles.outAsk} role="group" aria-label="Sign out">
          <p>Sign out of Medistry on this device?</p>
          <div className={styles.outBtns}>
            <button type="button" className={styles.signOut} onClick={() => setAsking(false)} disabled={leaving}>
              Stay signed in
            </button>
            <button type="button" className={`${styles.signOut} ${styles.signOutGo}`} disabled={leaving} onClick={signOut}>
              <SignOut size={20} />
              {leaving ? "Signing out" : "Sign out"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.signOut} onClick={() => setAsking(true)}>
          <SignOut size={20} />
          Sign out
        </button>
      )}
      <p className={styles.version}>
        Medistry for patients, version{" "}
        <span className="num">{VERSION}</span>
      </p>
    </div>
  );
}
