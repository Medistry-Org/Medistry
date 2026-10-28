"use client";

/** The chosen doctor's open times, one day at a time, and the Book button (the kit's SlotPicker). */

import { useCallback } from "react";
import { listDoctorSlots } from "@/services/appointmentService";
import Card from "@/components/ui/Card";
import SlotPicker, { type PickableSlot } from "@/components/ui/SlotPicker";
import styles from "../BookPage.module.css";

export default function TimeCard({ doctorId, onConfirm }: { doctorId: number; onConfirm: (slot: PickableSlot) => Promise<void> }) {
  const loadSlots = useCallback(
    (day: Date) => listDoctorSlots(doctorId, day).then((slots) => slots.map((slot) => ({ id: String(slot.slotId), at: slot.startsAt, open: true }))),
    [doctorId],
  );
  return (
    <Card title="Select date and slot" className={styles.card}>
      <SlotPicker key={doctorId} loadSlots={loadSlots} onConfirm={onConfirm} />
    </Card>
  );
}
