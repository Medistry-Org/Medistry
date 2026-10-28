"use client";

import { useEffect, useRef, useState } from "react";
import { shortDate } from "@/lib/format/dateTime";
import surfaceStyles from "./styles/Surfaces.module.css";

/**
 * Dated readings as points joined by a line. Only what was measured: no trend line, no target,
 * no forecast (compliance). Sized to its container so text and dots never stretch.
 */
export default function WeightChart({ readings, unit, toUnit }: { readings: { at: string; kg: number }[]; unit: string; toUnit: (kg: number) => number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const HEIGHT = 168;
  const pad = { l: 34, r: 12, t: 14, b: 26 };
  const values = readings.map((r) => toUnit(r.kg));
  const lo = Math.floor(Math.min(...values) - 0.6);
  const hi = Math.ceil(Math.max(...values) + 0.6);
  const t0 = readings.length ? new Date(readings[0].at).getTime() : 0;
  const t1 = Math.max(t0 + 1, readings.length ? new Date(readings[readings.length - 1].at).getTime() : 1);
  const x = (iso: string) => pad.l + ((new Date(iso).getTime() - t0) / (t1 - t0)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (HEIGHT - pad.t - pad.b);
  const points = readings.map((r, i) => [x(r.at), y(values[i])] as const);
  const path = points.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
  const mid = Math.round(((lo + hi) / 2) * 2) / 2;

  return (
    <div ref={ref} className={surfaceStyles.chart}>
      {width > 0 && readings.length > 1 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={`Weight readings: ${readings.map((r, i) => `${shortDate(r.at)} ${values[i].toFixed(1)} ${unit}`).join(", ")}`}>
          {[hi, mid, lo].map((gridValue) => (
            <g key={gridValue}>
              <line x1={pad.l} x2={width - pad.r} y1={y(gridValue)} y2={y(gridValue)} className={surfaceStyles.grid} />
              <text x={pad.l - 8} y={y(gridValue) + 4} textAnchor="end" className={surfaceStyles.axis}>
                {gridValue}
              </text>
            </g>
          ))}
          <path d={path} className={surfaceStyles.line} />
          {points.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={i === points.length - 1 ? 5 : 3.5} className={i === points.length - 1 ? surfaceStyles.dotLast : surfaceStyles.dot} />
          ))}
          <text x={pad.l} y={HEIGHT - 6} className={surfaceStyles.axis}>
            {shortDate(readings[0].at)}
          </text>
          <text x={width - pad.r} y={HEIGHT - 6} textAnchor="end" className={surfaceStyles.axis}>
            {shortDate(readings[readings.length - 1].at)}
          </text>
        </svg>
      )}
    </div>
  );
}
