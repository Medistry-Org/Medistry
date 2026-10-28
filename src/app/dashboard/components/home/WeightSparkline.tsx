/*
  The weight readings as one quiet line (Arhaan HomeView Spark), drawn only where the screen has
  room. The scale keeps at least 2 kg of air above and below the readings, so a small wobble never
  looks like a cliff. On a laptop the highest and lowest readings are labelled at their height.
*/

import { kgTo, type WeightUnit } from "@/lib/units/measurementUnits";
import type { WeightReading } from "@/types/tracker";
import styles from "./Home.module.css";

export default function WeightSparkline({ readings, unit }: { readings: WeightReading[]; unit: WeightUnit }) {
  if (readings.length < 2) return null;
  const values = readings.map((reading) => reading.weightKg);
  const t0 = new Date(readings[0].loggedAt).getTime();
  const t1 = Math.max(t0 + 1, new Date(readings[readings.length - 1].loggedAt).getTime());
  const min = Math.min(...values);
  const max = Math.max(...values);
  const low = min - 2;
  const high = max + 2;
  const y = (kg: number) => (1 - (kg - low) / (high - low)) * 40;
  const points = readings.map((reading) => [((new Date(reading.loggedAt).getTime() - t0) / (t1 - t0)) * 100, y(reading.weightKg)] as const);
  const [lastX, lastY] = points[points.length - 1];
  // both values only when they sit a full line apart; otherwise the latest alone
  const labelled = y(min) - y(max) >= 14 ? [max, min] : [values[values.length - 1]];

  return (
    <div className={styles.spark} aria-hidden="true">
      <svg viewBox="-3 -4 106 48" preserveAspectRatio="none">
        {[max, min].map((kg) => (
          <line key={kg} className={styles.sparkRule} x1={-3} x2={103} y1={y(kg)} y2={y(kg)} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={points.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("")} vectorEffect="non-scaling-stroke" />
      </svg>
      {/* the latest reading as an HTML dot over the stretched chart: a round-capped SVG dot draws at
          different sizes across browsers */}
      <i className={styles.sparkEnd} style={{ left: `${((lastX + 3) / 106) * 100}%`, top: `${((lastY + 4) / 48) * 100}%` }} />
      {labelled.map((kg) => (
        <span key={kg} className={`${styles.sparkLabel} num`} style={{ top: `${((y(kg) + 4) / 48) * 100}%` }}>
          {kgTo(kg, unit).toFixed(1)}
        </span>
      ))}
    </div>
  );
}
