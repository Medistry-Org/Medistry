"use client";

/**
 * Consultation and diagnostics (/pricing, linked from the landing page): the team's flow and words,
 * in the app's design. With a report from the last 3 months: upload it, then book the doctor (the
 * consultation fee is paid there, once a doctor is chosen). Without one: choose a lab plan, pay at
 * the checkout, then book the home test. Signing in comes first for either.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "@phosphor-icons/react";
import { isSignedIn } from "@/lib/session/authSession";
import { uploadReport } from "@/services/reportService";
import type { NewReport } from "@/types/report";
import Card from "@/components/ui/Card";
import LabReportUpload from "@/components/ui/LabReportUpload";
import PageHead from "@/components/ui/PageHead";
import SegmentedControl from "@/components/ui/SegmentedControl";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import LabPlanCard from "./components/LabPlanCard";
import { NO_REPORT_PLANS, type LabPlan } from "./labPlans";
import styles from "./Pricing.module.css";

const SIGN_IN = "/sign-in";
const BOOK_DOCTOR = "/dashboard/appointments/book";
const BOOK_LAB_TEST = "/dashboard/lab-tests/book";

export default function PricingConsultationPage() {
  const router = useRouter();
  const [reportTab, setReportTab] = useState<"yes" | "no">("yes");

  const proceedWithReport = async (report: NewReport) => {
    if (!isSignedIn()) return router.push(SIGN_IN);
    await uploadReport(report);
    router.push(BOOK_DOCTOR);
  };

  const selectPlan = (plan: LabPlan) => {
    if (!isSignedIn()) return router.push(SIGN_IN);
    router.push(`/dashboard/checkout?purpose=PLAN&referenceId=${encodeURIComponent(plan.id)}&returnTo=${encodeURIComponent(BOOK_LAB_TEST)}`);
  };

  return (
    <main className={layoutStyles.page}>
      <PageHead title="Consultation & Diagnostics Flow" back={{ href: "/", label: "Home" }} sub="Upload existing medical reports or book a certified lab test package." />

      <div className={styles.flow}>
        <SegmentedControl
          label="Do you have a report"
          value={reportTab}
          options={[
            { value: "yes", label: "Yes, I have a Report" },
            { value: "no", label: "No, I have no Report" },
          ]}
          onChange={setReportTab}
        />

        {reportTab === "yes" && (
          <Card title="Verify & Upload Existing Lab Report">
            <p className={styles.text}>Our medical team only reviews diagnostic reports conducted within the last 3 months.</p>
            <LabReportUpload
              dateLabel="Select Report Issue Date:"
              chooseLabel="Click to upload report (PDF / Image)"
              submitLabel="Pay Doctor Consultation Fee & Book Slot"
              tooOldAdvice={`Please select "I have no report" to order a fresh test.`}
              onUpload={proceedWithReport}
            />
          </Card>
        )}

        {reportTab === "no" && (
          <>
            <div className={styles.notice}>
              <Clock size={20} aria-hidden="true" />
              <p>
                <strong>How it works:</strong> Book a lab test package below. Once the home phlebotomist collects your sample, your report will be generated and{" "}
                <strong>sent directly to your WhatsApp within 5 hours</strong>. You can then use that fresh report under <em>&quot;Yes, I have a report&quot;</em> to
                schedule your doctor review!
              </p>
            </div>
            <div className={styles.plans}>
              {NO_REPORT_PLANS.map((plan) => (
                <LabPlanCard key={plan.id} plan={plan} onChoose={selectPlan} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
