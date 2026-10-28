/* One progress photo in the record, front or side: blurred until the doctor chooses to look, with its date and the weight logged that week. */

import { shortDate } from "@/lib/format/dateTime";
import type { ProgressPhotoSet } from "@/types/patientRecord";
import styles from "./ProgressPhoto.module.css";

export default function ProgressPhoto({
  set,
  pose,
  label,
  hidden,
}: {
  set: ProgressPhotoSet;
  pose: "front" | "side";
  label: string;
  hidden: boolean;
}) {
  const src = pose === "front" ? set.frontUrl : set.sideUrl;
  const alt = `${pose === "front" ? "Front" : "Side"} view, ${shortDate(set.takenAt)}`;
  return (
    <figure className={styles.figure}>
      {src ? (
        <span className={styles.pic} data-hidden={hidden || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a private, signed URL from the backend */}
          <img src={src} alt={hidden ? "" : alt} draggable={false} />
        </span>
      ) : (
        <span className={`${styles.pic} ${styles.none}`}>No {pose} view</span>
      )}
      <figcaption className={styles.cap}>
        <strong>{label}</strong>
        <span>
          <span className="num">{shortDate(set.takenAt)}</span>
          {set.weightKg !== null && (
            <>
              , <span className="num">{set.weightKg.toFixed(1)} kg</span>
            </>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
