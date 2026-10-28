"use client";

/**
 * Book a consultation: choose a doctor, say what it is about, then choose a time.
 * Data: GET /api/doctors, GET /api/schedule/slots/:doctorId/:date, PUT /api/schedule/book.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { listBookableDoctors } from "@/services/doctorDirectoryService";
import { bookSlot } from "@/services/appointmentService";
import { useApiResource } from "@/hooks/useApiResource";
import { clockTime } from "@/lib/format/dateTime";
import type { DoctorSummary } from "@/types/doctor";
import PageHead from "@/components/ui/PageHead";
import Card from "@/components/ui/Card";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorNotice from "@/components/ui/ErrorNotice";
import { spokenDay, type PickableSlot } from "@/components/ui/SlotPicker";
import { useToast } from "@/components/ui/ToastProvider";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import DoctorList from "./components/DoctorList";
import ChosenDoctorCard from "./components/ChosenDoctorCard";
import ReasonFields from "./components/ReasonFields";
import TimeCard from "./components/TimeCard";
import styles from "./BookPage.module.css";

export default function BookAppointmentPage() {
  const router = useRouter();
  const toast = useToast();
  const doctors = useApiResource("bookable-doctors", listBookableDoctors);
  const [doctor, setDoctor] = useState<DoctorSummary | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [reasonMissing, setReasonMissing] = useState(false);

  const book = async (slot: PickableSlot) => {
    if (!symptoms.trim()) {
      setReasonMissing(true);
      throw new Error("Add the reason or symptoms first.");
    }
    const reason = notes.trim() ? `${symptoms.trim()} | Note: ${notes.trim()}` : symptoms.trim();
    await bookSlot({ slotId: Number(slot.id), consultationType: "Virtual", reason });
    const at = new Date(slot.at);
    toast(`Booked for ${spokenDay(at)}, ${clockTime(at)}`);
    router.push("/dashboard/appointments");
  };

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead title="Book an appointment" back={{ href: "/dashboard/appointments", label: "Appointments" }} />

      {!doctor && doctors.loading && !doctors.data && <LoadingSkeleton />}
      {!doctor && doctors.error && <ErrorNotice message={doctors.error} onRetry={doctors.reload} />}

      <div className={styles.cols}>
        {!doctor && doctors.data && (
          <Card title="Select doctor" className={styles.card}>
            <DoctorList doctors={doctors.data} onChoose={setDoctor} />
          </Card>
        )}
        {doctor && (
          <>
            <ChosenDoctorCard doctor={doctor} onChange={() => setDoctor(null)} />
            <Card title="Appointment details" className={styles.card}>
              <ReasonFields
                symptoms={symptoms}
                notes={notes}
                reasonMissing={reasonMissing}
                onSymptomsChange={(value) => {
                  setSymptoms(value);
                  setReasonMissing(false);
                }}
                onNotesChange={setNotes}
              />
            </Card>
            <TimeCard doctorId={doctor.id} onConfirm={book} />
          </>
        )}
      </div>
    </main>
  );
}
