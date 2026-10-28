/**
 * A banded track with a gliding marker, the read-out under the BMI (from the design repository's
 * tools kit). Decorative: the number beside it carries the meaning.
 */

import type { CSSProperties } from "react";
import styles from "./BandTrack.module.css";

type Props = {
  min: number;
  max: number;
  /** leave out to show the bands without a marker */
  value?: number;
  bands: { to: number; tone: 0 | 1 | 2 }[];
  cuts: number[];
};

export default function BandTrack({ min, max, value, bands, cuts }: Props) {
  const percent = (reading: number) =>
    Math.min(100, Math.max(0, ((reading - min) / (max - min)) * 100));
  const segments = bands.map((band, index) => {
    const left = percent(index === 0 ? min : bands[index - 1].to);
    return {
      tone: band.tone,
      left,
      width: percent(Math.min(band.to, max)) - left,
    };
  });
  return (
    <div className={styles.trackWrap} aria-hidden="true">
      <div className={styles.track}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={styles.band}
            data-tone={segment.tone}
            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
          />
        ))}
        {value !== undefined && (
          <span
            className={styles.slide}
            style={{ "--x": `${percent(value)}%` } as CSSProperties}
          >
            <i className={styles.marker} />
          </span>
        )}
      </div>
      <div className={styles.axis}>
        {cuts.map((cut) => (
          <span key={cut} className="num" style={{ left: `${percent(cut)}%` }}>
            {cut}
          </span>
        ))}
      </div>
    </div>
  );
}
