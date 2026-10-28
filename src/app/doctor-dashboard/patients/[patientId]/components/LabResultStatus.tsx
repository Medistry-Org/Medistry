/*
  A result against its range, in words (Arhaan's lab Status). Red is kept for what is out of range
  and not getting better, and only while it still needs the doctor; an improving result does not
  shout like a worsening one.
*/

import type { LabResult } from "@/types/patientRecord";
import RangeFlag from "./RangeFlag";
import styles from "./LabCard.module.css";

export default function LabResultStatus({
  result,
  before,
  reviewed,
}: {
  result: LabResult;
  before?: number;
  reviewed: boolean;
}) {
  if (result.flag === "NORMAL") return <RangeFlag flag="NORMAL" />;
  const improving =
    before !== undefined &&
    ((result.flag === "HIGH" && result.value < before) ||
      (result.flag === "LOW" && result.value > before));
  return (
    <span
      className={styles.status2}
      data-tone={improving ? "better" : reviewed ? "seen" : "worse"}
    >
      <i aria-hidden="true" />
      {result.flag === "HIGH" ? "Above" : "Below"}
      {improving ? ", improving" : ""}
    </span>
  );
}
