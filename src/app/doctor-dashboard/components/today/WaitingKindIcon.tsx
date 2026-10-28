/* A waiting item's icon in Today's queue: a report, a prescription, a note, a message (filled when urgent) or a symptom (filled when severe). */

import {
  ChatsCircle,
  Flask,
  Notepad,
  Prescription,
  WarningCircle,
} from "@phosphor-icons/react";
import type { WaitingItem } from "@/types/patientRecord";

export default function WaitingKindIcon({ item }: { item: WaitingItem }) {
  if (item.kind === "lab") return <Flask size={18} />;
  if (item.kind === "rx") return <Prescription size={18} />;
  if (item.kind === "note") return <Notepad size={18} />;
  if (item.kind === "message")
    return item.urgent ? (
      <WarningCircle size={18} weight="fill" />
    ) : (
      <ChatsCircle size={18} />
    );
  return (
    <WarningCircle
      size={18}
      weight={item.severity === "Severe" ? "fill" : "regular"}
    />
  );
}
