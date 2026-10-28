"use client";

/*
  Home (Arhaan HomeView): a greeting, the next thing to do as one line with Chat beside it, the
  weight card, and one card for where the patient stands in care. On a phone it never scrolls.
  Data: the patient's consultations, their profile (name, weight, plan) and weight readings.
*/

import { useCallback } from "react";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { errorMessage } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import { listMyAppointments } from "@/services/appointmentService";
import { getMyProfile } from "@/services/patientProfileService";
import { deleteWeightReading, listWeightReadings, logWeight } from "@/services/trackerService";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import { careStageOf, isPlanActive, upcomingConsultation } from "./careStage";
import FirstStepsCard from "./FirstStepsCard";
import NextStepStrip from "./NextStepStrip";
import ProgrammeCard from "./ProgrammeCard";
import WeightCard from "./WeightCard";
import styles from "./Home.module.css";

function greeting(hour: number) {
  if (hour < 5) return "Hello";
  if (hour >= 17) return "Good evening";
  if (hour < 12) return "Good morning";
  return "Good afternoon";
}

async function loadHome() {
  const [appointments, profile, weights] = await Promise.all([listMyAppointments(), getMyProfile(), listWeightReadings()]);
  return { appointments, profile, weights };
}

export default function HomeView() {
  const toast = useToast();
  const now = useNow();
  const home = useApiResource("patient-home", loadHome);
  const { data, reload } = home;

  const saveWeight = useCallback(
    async (weightKg: number) => {
      const reading = await logWeight(weightKg);
      reload();
      toast("Weight saved", () => {
        deleteWeightReading(reading.id)
          .then(reload)
          .catch((error) => toast(errorMessage(error)));
      });
    },
    [reload, toast],
  );

  if (!data) {
    return <main className={layoutStyles.page}>{home.error ? <ErrorNotice message={home.error} onRetry={reload} /> : <LoadingSkeleton />}</main>;
  }

  const fullName = data.profile.fullName || getSessionUser()?.fullName || "";
  const firstName = fullName.trim().split(" ")[0] || "there";
  const planActive = isPlanActive(data.profile.planStatus);
  const upcoming = upcomingConsultation(data.appointments, now);
  const stage = careStageOf(data.appointments, planActive, now);
  // one filled button per screen: when the next-step line is a dark "do this", logging steps back
  const nextStepIsAction = !upcoming;

  return (
    <main className={styles.home} data-screen="home">
      <header className={styles.hello}>
        <h1 className={styles.h1}>
          {greeting(new Date(now).getHours())}, {firstName}.
        </h1>
        <p className={styles.sub}>Welcome to Medistry</p>
      </header>

      <NextStepStrip upcoming={upcoming} stage={stage} now={now} />

      <WeightCard readings={data.weights} profileWeightKg={data.profile.weightKg} primary={!nextStepIsAction} onSave={saveWeight} />

      {stage === "before-consultation" ? <FirstStepsCard upcoming={upcoming} /> : <ProgrammeCard active={stage === "in-programme"} planName={data.profile.planName} />}
    </main>
  );
}
