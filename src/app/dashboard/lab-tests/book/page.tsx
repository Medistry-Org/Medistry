"use client";

/**
 * Book a home blood test, one decision per screen: test, address, person, time, then check and
 * pay. The flow's state lives in useLabBookingFlow; each step is its own component. Redcliffe is
 * reached only through the Medistry backend (docs/backend/lab-tests-redcliffe.md).
 */

import { useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useApiResource } from "@/hooks/useApiResource";
import { getMyProfile } from "@/services/patientProfileService";
import { getSessionUser } from "@/lib/session/authSession";
import BackLink, { backControlClass } from "@/components/ui/BackLink";
import Card from "@/components/ui/Card";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageHead from "@/components/ui/PageHead";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import { labCheckoutHref } from "../components/labBookingWording";
import AddressStep from "./components/AddressStep";
import PackageStep from "./components/PackageStep";
import PatientStep from "./components/PatientStep";
import ReviewStep from "./components/ReviewStep";
import TimeStep from "./components/TimeStep";
import { patientFromProfile, useLabBookingFlow, type LabBookingStep } from "./useLabBookingFlow";
import styles from "./components/LabBookingSteps.module.css";

const TITLES: Record<LabBookingStep, string> = {
  package: "Choose a test",
  address: "Where should we collect?",
  patient: "Who is being tested?",
  time: "Choose a time",
  review: "Check and pay",
};

/** The profile fills in the person step; a missing profile only means typing the details. */
const loadProfile = () => getMyProfile().catch(() => null);

export default function BookLabTestPage() {
  const flow = useLabBookingFlow();
  const profile = useApiResource("my-profile", loadProfile);
  const { step, chosenPackage, address } = flow;

  // each step starts at the top, as a new screen would
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  return (
    <main className={layoutStyles.page}>
      {step === "package" ? (
        <BackLink href="/dashboard/lab-tests" label="Blood tests" />
      ) : (
        <button type="button" className={backControlClass} onClick={flow.back}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Back
        </button>
      )}
      <PageHead
        title={TITLES[step]}
        sub={
          <span className="num">
            Step {flow.stepNumber} of {flow.stepCount}
          </span>
        }
      />

      <Card className={styles.flow}>
        {step === "package" && <PackageStep chosenCode={chosenPackage?.code ?? null} onChoose={flow.choosePackage} />}
        {step === "address" && <AddressStep chosenId={address?.id ?? null} onChoose={flow.chooseAddress} />}
        {step === "patient" &&
          chosenPackage &&
          (profile.loading ? (
            <LoadingSkeleton />
          ) : (
            <PatientStep
              initial={flow.patient ?? patientFromProfile(profile.data, getSessionUser()?.mobile ?? "")}
              labPackage={chosenPackage}
              onSave={flow.savePatient}
            />
          ))}
        {step === "time" && address && chosenPackage && <TimeStep addressId={address.id} labPackage={chosenPackage} onChoose={flow.chooseSlot} />}
        {step === "review" && <ReviewStep flow={flow} checkoutHref={labCheckoutHref} />}
      </Card>
    </main>
  );
}
