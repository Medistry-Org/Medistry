import { weekdayShort } from "@/lib/format/dateTime";
import surfaceStyles from "./styles/Surfaces.module.css";

/** Seven days as bars, with the daily target drawn across them. */
export default function WeekBars({ days, target, format, unit }: { days: { iso: string; v: number }[]; target: number; format: (n: number) => string; unit: string }) {
  const max = Math.max(target * 1.25, ...days.map((d) => d.v));
  return (
    <div className={surfaceStyles.week} role="img" aria-label={`Target ${format(target)} ${unit}. ` + days.map((d) => `${weekdayShort(d.iso)} ${format(d.v)}`).join(", ")}>
      <div className={surfaceStyles.weekPlot}>
        <i className={surfaceStyles.weekTarget} style={{ bottom: `${(target / max) * 100}%` }} aria-hidden="true" />
        {days.map((d) => (
          <span key={d.iso} className={surfaceStyles.weekBar} style={{ height: `${(d.v / max) * 100}%` }} data-met={d.v >= target} />
        ))}
      </div>
      <div className={surfaceStyles.weekDays} aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.iso} data-today={i === days.length - 1}>
            {i === days.length - 1 ? "Today" : weekdayShort(d.iso)}
          </span>
        ))}
      </div>
    </div>
  );
}
