"use client";

/**
 * After the last question: book the first consultation with the first bookable doctor (the
 * design does not let the patient choose), on the kit SlotPicker. "I booked by phone with
 * Medistry" is the quiet way out for someone who booked another way.
 */

import { useCallback, useState, type CSSProperties, type RefObject } from "react";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import SlotPicker, { type PickableSlot } from "@/components/ui/SlotPicker";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { useApiResource } from "@/hooks/useApiResource";
import { formatRupees } from "@/lib/format/money";
import { bookSlot, listDoctorSlots } from "@/services/appointmentService";
import { listBookableDoctors } from "@/services/doctorDirectoryService";
import { markBookedElsewhere } from "@/services/onboardingService";
import ChapterTag from "./ChapterTag";
import styles from "../OnboardingPage.module.css";
import bookingStyles from "./BookConsultationStep.module.css";

type Props = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onBooked: (startsAt: string) => void;
  onBookedElsewhere: () => void;
};

export default function BookConsultationStep({ headingRef, onBooked, onBookedElsewhere }: Props) {
  const doctors = useApiResource("bookable-doctors", listBookableDoctors);
  const doctor = doctors.data?.[0] ?? null;
  const doctorId = doctor?.id ?? null;
  const [leaving, setLeaving] = useState(false);

  const loadSlots = useCallback(
    async (day: Date): Promise<PickableSlot[]> =>
      doctorId === null ? [] : (await listDoctorSlots(doctorId, day)).map((slot) => ({ id: String(slot.slotId), at: slot.startsAt, open: true })),
    [doctorId],
  );

  const book = async (slot: PickableSlot) => {
    await bookSlot({ slotId: Number(slot.id), consultationType: "Virtual", reason: "First consultation" });
    onBooked(slot.at);
  };

  return (
    <div className={`${styles.stage} ${styles.wide}`}>
      <div className={styles.step} style={{ "--dir": 1 } as CSSProperties}>
        <ChapterTag>Profile complete</ChapterTag>
        <div className={styles.head}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.q}>
            Your first consultation
          </h1>
          {/* what it is always shows; who calls first and the fee give way on shorter phones (CSS) */}
          <p className={`${styles.why} ${styles.bookWhy}`}>
            30 minutes by video with a doctor.{" "}
            <span className={styles.whyMore}>A counsellor calls you before it to check the programme suits you and to pass your details to your doctor.</span>{" "}
            {doctor?.consultationFee != null && (
              <span className={styles.whyFee}>
                Assessment fee {formatRupees(doctor.consultationFee)}, covering the counsellor call, blood tests if needed and this consultation.
              </span>
            )}
          </p>
        </div>

        {doctors.loading && <LoadingSkeleton />}
        {doctors.error && <ErrorNotice message={doctors.error} onRetry={doctors.reload} />}
        {doctors.data && !doctor && <p className={formStyles.hint}>No doctor has open times yet. You can book from your account later.</p>}
        {doctor && <SlotPicker loadSlots={loadSlots} onConfirm={book} />}

        <button
          type="button"
          className={`${formStyles.link} ${bookingStyles.elsewhere}`}
          disabled={leaving}
          aria-busy={leaving}
          onClick={async () => {
            setLeaving(true);
            // the flag only stops the account asking them to book; the patient goes on either way
            await markBookedElsewhere().catch(() => undefined);
            onBookedElsewhere();
          }}
        >
          I booked by phone with Medistry
        </button>
      </div>
    </div>
  );
}
