/** A lab value's position against its range: in words and in tone, never colour alone. */

import styles from "./RangeFlag.module.css";

type RangePosition = "LOW" | "NORMAL" | "HIGH";

const WORDING: Record<RangePosition, string> = {
  LOW: "Below range",
  NORMAL: "In range",
  HIGH: "Above range",
};

export default function RangeFlag({ flag }: { flag: RangePosition }) {
  return (
    <span className={styles.flag} data-flag={flag}>
      <i aria-hidden="true" />
      {WORDING[flag]}
    </span>
  );
}
