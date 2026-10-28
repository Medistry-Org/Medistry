"use client";

/**
 * Decides where the patient starts: signed out goes to /sign-in, a doctor to their dashboard, a
 * finished profile to /dashboard; otherwise the questions open where the patient left off.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ErrorNotice from "@/components/ui/ErrorNotice";
import { useApiResource } from "@/hooks/useApiResource";
import { getSessionUser, homePathFor, isSignedIn } from "@/lib/session/authSession";
import { getOnboardingStatus } from "@/services/onboardingService";
import type { OnboardingStatus } from "@/types/onboarding";
import OnboardingScreens from "./OnboardingScreens";
import styles from "../OnboardingPage.module.css";

type Start = { redirectTo: string } | { status: OnboardingStatus | null };

async function loadStart(): Promise<Start> {
  const user = getSessionUser();
  if (!isSignedIn() || !user) return { redirectTo: "/sign-in" };
  if (user.role === "DOCTOR") return { redirectTo: homePathFor("DOCTOR") };
  const status = await getOnboardingStatus();
  if (status?.completed) return { redirectTo: homePathFor("PATIENT") };
  return { status };
}

export default function OnboardingFlow() {
  const router = useRouter();
  const start = useApiResource("onboarding-start", loadStart);
  const redirectTo = start.data && "redirectTo" in start.data ? start.data.redirectTo : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (start.error) {
    return (
      <main className={styles.page}>
        <div className={styles.stage}>
          <ErrorNotice message={start.error} onRetry={start.reload} />
        </div>
      </main>
    );
  }
  if (!start.data || !("status" in start.data)) return <main className={styles.page} aria-busy="true" />;
  return <OnboardingScreens status={start.data.status} />;
}
