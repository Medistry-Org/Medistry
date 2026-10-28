"use client";

/**
 * Moving a booked consultation to another of the same doctor's times, inside the "Change the time"
 * sheet. Calls the PROPOSED PATCH /api/appointments/:id/reschedule (appointmentService).
 */

import { useCallback } from "react";
import SlotPicker, { type PickableSlot } from "@/components/ui/SlotPicker";
import { useToast } from "@/components/ui/ToastProvider";
import { clockTime, spokenDay } from "@/lib/format/dateTime";
import { ApiError } from "@/lib/http/apiClient";
import {
  listDoctorSlots,
  rescheduleAppointment,
} from "@/services/appointmentService";
import type { Appointment } from "@/types/appointment";
import styles from "../AppointmentsPage.module.css";

export default function ConsultationChangeTimeSheet({
  appointment,
  onMoved,
}: {
  appointment: Appointment;
  onMoved: () => void;
}) {
  const toast = useToast();
  const doctorId = Number(appointment.doctorId);
  const bookedAt = new Date(appointment.startsAt);

  const loadSlots = useCallback(
    (day: Date) =>
      listDoctorSlots(doctorId, day).then((slots) =>
        slots.map((slot) => ({
          id: String(slot.slotId),
          at: slot.startsAt,
          open: true,
        })),
      ),
    [doctorId],
  );

  const move = async (slot: PickableSlot) => {
    try {
      await rescheduleAppointment(appointment.id, Number(slot.id));
    } catch (caught) {
      if (caught instanceof ApiError && caught.isMissingEndpoint)
        throw new Error(
          "Changing the time is not available yet. Message your doctor to move it.",
        );
      throw caught;
    }
    const at = new Date(slot.at);
    toast(`Moved to ${spokenDay(at)}, ${clockTime(at)}`);
    onMoved();
  };

  return (
    <div className={styles.sheetBody}>
      <p className={styles.sheetMeta}>
        Booked {spokenDay(bookedAt)},{" "}
        <span className="num">{clockTime(bookedAt)}</span>. A new time moves it.
      </p>
      <SlotPicker
        loadSlots={loadSlots}
        onConfirm={move}
        confirmLabel="Move to"
      />
    </div>
  );
}
