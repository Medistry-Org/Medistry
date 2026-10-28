"use client";

/**
 * Dated readings as points joined by a line. Only what was measured: no trend line, no target,
 * no forecast (compliance). Sized to its container so text and dots never stretch.
 */

import { useEffect, useRef, useState } from "react";
import { shortDate } from "@/lib/format/dateTime";
import styles from "./WeightChart.module.css";

const HEIGHT = 168;
const PADDING = { left: 34, right: 12, top: 14, bottom: 26 };

export default function WeightChart({
  readings,
  unit,
  toUnit,
}: {
  readings: { at: string; kg: number }[];
  unit: string;
  toUnit: (kg: number) => number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const values = readings.map((reading) => toUnit(reading.kg));
  const lowest = Math.floor(Math.min(...values) - 0.6);
  const highest = Math.ceil(Math.max(...values) + 0.6);
  const firstTime = readings.length ? new Date(readings[0].at).getTime() : 0;
  const lastTime = Math.max(
    firstTime + 1,
    readings.length ? new Date(readings[readings.length - 1].at).getTime() : 1,
  );
  const xOf = (iso: string) =>
    PADDING.left +
    ((new Date(iso).getTime() - firstTime) / (lastTime - firstTime)) *
      (width - PADDING.left - PADDING.right);
  const yOf = (value: number) =>
    PADDING.top +
    (1 - (value - lowest) / (highest - lowest)) *
      (HEIGHT - PADDING.top - PADDING.bottom);
  const points = readings.map(
    (reading, i) => [xOf(reading.at), yOf(values[i])] as const,
  );
  const path = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join("");
  const middle = Math.round(((lowest + highest) / 2) * 2) / 2;

  return (
    <div ref={box} className={styles.chart}>
      {width > 0 && readings.length > 1 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Weight readings: ${readings.map((reading, i) => `${shortDate(reading.at)} ${values[i].toFixed(1)} ${unit}`).join(", ")}`}
        >
          {[highest, middle, lowest].map((gridValue) => (
            <g key={gridValue}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={yOf(gridValue)}
                y2={yOf(gridValue)}
                className={styles.grid}
              />
              <text
                x={PADDING.left - 8}
                y={yOf(gridValue) + 4}
                textAnchor="end"
                className={styles.axis}
              >
                {gridValue}
              </text>
            </g>
          ))}
          <path d={path} className={styles.line} />
          {points.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === points.length - 1 ? 5 : 3.5}
              className={i === points.length - 1 ? styles.dotLast : styles.dot}
            />
          ))}
          <text x={PADDING.left} y={HEIGHT - 6} className={styles.axis}>
            {shortDate(readings[0].at)}
          </text>
          <text
            x={width - PADDING.right}
            y={HEIGHT - 6}
            textAnchor="end"
            className={styles.axis}
          >
            {shortDate(readings[readings.length - 1].at)}
          </text>
        </svg>
      )}
    </div>
  );
}
