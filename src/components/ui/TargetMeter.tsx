import type { ReactNode } from "react";
import surfaceStyles from "./styles/Surfaces.module.css";

/** Progress against a daily target: a measured track, the target marked as a tick. */
export default function TargetMeter({ label, value, target, unit, format = (n) => String(n) }: { label: ReactNode; value: number; target: number; unit: string; format?: (n: number) => string }) {
  const fraction = Math.min(1, value / target);
  return (
    <div className={surfaceStyles.meter}>
      <div className={surfaceStyles.meterHead}>
        <span className={surfaceStyles.meterLabel}>{label}</span>
        <span className={`${surfaceStyles.meterNum} num`}>
          {format(value)} <span>of {format(target)} {unit}</span>
        </span>
      </div>
      <div className={surfaceStyles.meterTrack} role="img" aria-label={`${format(value)} of ${format(target)} ${unit}`}>
        <i style={{ transform: `scaleX(${fraction})` }} data-full={value >= target} />
      </div>
    </div>
  );
}
