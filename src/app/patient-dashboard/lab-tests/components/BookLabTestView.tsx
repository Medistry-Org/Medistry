"use client";

/**
 * /patient-dashboard/lab-tests/book: book a home blood test, one decision per screen (test, address,
 * person, time, then check and pay). The steps are the shared lab booking feature
 * (src/features/lab-booking); this page adds the dashboard heading, Back and the card.
 */

import { useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import BackLink, { backControlClass } from "@/components/ui/BackLink";
import Card from "@/components/ui/Card";
import PageHead from "@/components/ui/PageHead";
import LabBookingFlow from "@/features/lab-booking/LabBookingFlow";
import { useLabBookingFlow } from "@/features/lab-booking/useLabBookingFlow";
import type { LabBooking } from "@/types/labTest";
import layoutStyles from "@/components/ui/styles/PageLayout.module.css";
import { labCheckoutHref } from "./labBookingFormat";

const bookingPage = (booking: LabBooking) =>
  `/patient-dashboard/lab-tests/${booking.id}`;

export default function BookLabTestView() {
  const flow = useLabBookingFlow("dashboard");

  // each step starts at the top, as a new screen would
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [flow.step]);

  return (
    <main className={`${layoutStyles.page} ${layoutStyles.narrow}`}>
      {flow.isFirstStep ? (
        <BackLink href="/patient-dashboard/lab-tests" label="Blood tests" />
      ) : (
        <button type="button" className={backControlClass} onClick={flow.back}>
          <ArrowLeft size={14} weight="bold" aria-hidden="true" /> Back
        </button>
      )}
      <PageHead
        title={flow.title}
        sub={
          <span className="num">
            Step {flow.stepNumber} of {flow.stepCount}
          </span>
        }
      />
      <Card>
        <LabBookingFlow
          flow={flow}
          checkoutHref={labCheckoutHref}
          bookedHref={bookingPage}
        />
      </Card>
    </main>
  );
}
