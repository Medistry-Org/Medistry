"use client";

/**
 * Appointments: what is booked (with Join, camera check, Change time, Message and Add to calendar)
 * and past consultations. Data: GET /api/appointments/patient. Design: the design repo's
 * Appointments.tsx.
 */

import { useState } from "react";
import { listMyAppointments } from "@/services/appointmentService";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { isUpcomingConsultation } from "@/lib/consultations/consultationTime";
import type { Appointment } from "@/types/appointment";
import PageHead from "@/components/ui/PageHead";
import Sheet from "@/components/ui/Sheet";
import DeviceCheck from "@/components/ui/DeviceCheck";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorNotice from "@/components/ui/ErrorNotice";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import UpcomingCard from "./components/UpcomingCard";
import PastConsultationsCard from "./components/PastConsultationsCard";
import ChangeTimeSheet from "./components/ChangeTimeSheet";
import styles from "./AppointmentsPage.module.css";

export default function AppointmentsPage() {
  const now = useNow();
  const appointments = useApiResource("my-appointments", listMyAppointments);
  const [checkingDevices, setCheckingDevices] = useState(false);
  const [moving, setMoving] = useState<Appointment | null>(null);

  const all = appointments.data ?? [];
  const upcoming = all.filter((a) => isUpcomingConsultation(a, now));
  const past = all.filter((a) => !isUpcomingConsultation(a, now)).reverse();

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead title="Appointments" back={{ href: "/dashboard/care", label: "Care" }} />

      {appointments.loading && !appointments.data && <LoadingSkeleton />}
      {appointments.error && <ErrorNotice message={appointments.error} onRetry={appointments.reload} />}

      {appointments.data && (
        <div className={styles.cols}>
          <UpcomingCard upcoming={upcoming} now={now} onCheckDevices={() => setCheckingDevices(true)} onChangeTime={setMoving} />
          <PastConsultationsCard past={past} />
        </div>
      )}

      <Sheet open={checkingDevices} onClose={() => setCheckingDevices(false)} title="Camera and microphone">
        {checkingDevices && <DeviceCheck />}
      </Sheet>
      <Sheet open={!!moving} onClose={() => setMoving(null)} title="Change the time">
        {moving && (
          <ChangeTimeSheet
            appointment={moving}
            onMoved={() => {
              setMoving(null);
              appointments.reload();
            }}
          />
        )}
      </Sheet>
    </main>
  );
}
