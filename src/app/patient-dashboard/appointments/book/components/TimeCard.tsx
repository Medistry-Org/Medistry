"use client";

/**
 * The open consultation times, one day at a time, and the confirm button (the kit's SlotPicker).
 * The backend decides whose times these are (every doctor's, or the care-team doctor's), so the
 * patient only ever chooses a time.
 */

import { useCallback } from "react";
import Card from "@/components/ui/Card";
import SlotPicker, { type PickableSlot } from "@/components/ui/SlotPicker";
import { listAvailableSlots } from "@/services/appointmentService";
import styles from "../BookPage.module.css";

export default function TimeCard({
  confirmLabel,
  note,
  onConfirm,
}: {
  confirmLabel: string;
  note: string;
  onConfirm: (slot: PickableSlot) => Promise<void>;
}) {
  const loadSlots = useCallback(
    (day: Date) =>
      listAvailableSlots(day).then((slots) =>
        slots.map((slot) => ({
          id: String(slot.slotId),
          at: slot.startsAt,
          open: true,
        })),
      ),
    [],
  );
  return (
    <Card title="Choose a time" className={styles.card}>
      <SlotPicker
        loadSlots={loadSlots}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        note={note}
      />
    </Card>
  );
}
