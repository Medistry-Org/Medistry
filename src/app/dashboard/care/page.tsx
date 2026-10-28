"use client";

/**
 * Care: the doctors looking after you, your programme and treatment, blood tests and the next
 * consultation. Design: the design repo's CareTab.tsx.
 * Data: GET /api/appointments/patient, GET /api/subscriptions/status + /plans, and the PROPOSED
 * care-plan endpoints in carePlanService (prescription and deliveries; a calm note until they exist).
 */

import { useState } from "react";
import { listMyAppointments } from "@/services/appointmentService";
import { loadCarePlan } from "@/services/carePlanService";
import { getSubscriptionStatus, listPlans } from "@/services/subscriptionService";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { getSessionUser } from "@/lib/session/authSession";
import { isUpcomingConsultation } from "@/lib/consultations/consultationTime";
import { doctorsFrom, type ConsultationDoctor } from "@/lib/consultations/consultationDoctors";
import PageHead from "@/components/ui/PageHead";
import Sheet from "@/components/ui/Sheet";
import DeviceCheck from "@/components/ui/DeviceCheck";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorNotice from "@/components/ui/ErrorNotice";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import CareTeamCard from "./components/CareTeamCard";
import ProgrammeCard, { type Programme } from "./components/ProgrammeCard";
import BloodTestsCard from "./components/BloodTestsCard";
import AppointmentsCard from "./components/AppointmentsCard";
import DoctorSheet from "./components/DoctorSheet";
import PrescriptionSheet from "./components/PrescriptionSheet";
import DeliverySheet from "./components/DeliverySheet";
import styles from "./CarePage.module.css";

/** The signed-in patient's active plan, if any. */
async function loadProgramme(): Promise<Programme> {
  const userId = getSessionUser()?.userId;
  if (!userId) return { active: false, plan: null };
  const status = await getSubscriptionStatus(userId);
  if (!status.hasActivePlan) return { active: false, plan: null };
  const plans = await listPlans();
  return { active: true, plan: plans.find((plan) => plan.id === status.planId) ?? null };
}

type SheetName = "rx" | "delivery" | "devices" | null;

export default function CarePage() {
  const now = useNow();
  const appointments = useApiResource("my-appointments", listMyAppointments);
  const programme = useApiResource("my-programme", loadProgramme);
  const carePlan = useApiResource("care-plan", loadCarePlan);
  const [doctor, setDoctor] = useState<ConsultationDoctor | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);

  const all = appointments.data ?? [];
  const doctors = doctorsFrom(all);
  const next = all.find((appointment) => isUpcomingConsultation(appointment, now)) ?? null;
  const hasTeam = doctors.length > 0;
  const prescription = carePlan.data?.prescription ?? null;
  // the delivery on its way if there is one, otherwise the last one that arrived
  const orders = carePlan.data?.orders ?? [];
  const order = orders.find((o) => o.status !== "DELIVERED") ?? orders[0] ?? null;
  const closeSheet = () => setSheet(null);

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead title="Your care" />

      {appointments.loading && !appointments.data && <LoadingSkeleton />}
      {appointments.error && <ErrorNotice message={appointments.error} onRetry={appointments.reload} />}

      {appointments.data && (
        <div className={`${styles.grid} ${hasTeam ? "" : styles.gridFirst}`}>
          {hasTeam ? (
            <CareTeamCard doctors={doctors} next={next} onOpenDoctor={setDoctor} />
          ) : (
            <AppointmentsCard next={null} now={now} everyWidth onCheckDevices={() => setSheet("devices")} />
          )}
          <ProgrammeCard
            programme={programme.data}
            programmeError={programme.error}
            carePlan={carePlan.data}
            carePlanError={carePlan.error}
            order={order}
            onRetry={() => {
              programme.reload();
              carePlan.reload();
            }}
            onOpenPrescription={() => setSheet("rx")}
            onOpenDelivery={() => setSheet("delivery")}
          />
          <BloodTestsCard hasTeam={hasTeam} />
          {hasTeam && <AppointmentsCard next={next} now={now} onCheckDevices={() => setSheet("devices")} />}
        </div>
      )}

      <Sheet open={!!doctor} onClose={() => setDoctor(null)} title={doctor?.name ?? ""}>
        {doctor && <DoctorSheet doctor={doctor} booked={all.find((a) => isUpcomingConsultation(a, now) && (a.doctorId ?? a.doctorName) === (doctor.doctorId ?? doctor.name)) ?? null} />}
      </Sheet>
      <Sheet open={sheet === "rx"} onClose={closeSheet} title="Your prescription">
        {sheet === "rx" && prescription && <PrescriptionSheet prescription={prescription} />}
      </Sheet>
      <Sheet open={sheet === "delivery"} onClose={closeSheet} title={order?.status === "DELIVERED" ? "Last delivery" : "Next delivery"}>
        {sheet === "delivery" && order && <DeliverySheet order={order} />}
      </Sheet>
      <Sheet open={sheet === "devices"} onClose={closeSheet} title="Camera and microphone">
        {sheet === "devices" && <DeviceCheck />}
      </Sheet>
    </main>
  );
}
