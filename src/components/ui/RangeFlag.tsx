import surfaceStyles from "./styles/Surfaces.module.css";

export type RangeFlagValue = "LOW" | "NORMAL" | "HIGH";

/** A lab value's position against its range: in words and in tone, never colour alone. */
export default function RangeFlag({ flag }: { flag: RangeFlagValue }) {
  return (
    <span className={surfaceStyles.flag} data-flag={flag}>
      <i aria-hidden="true" />
      {flag === "NORMAL" ? "In range" : flag === "HIGH" ? "Above range" : "Below range"}
    </span>
  );
}
