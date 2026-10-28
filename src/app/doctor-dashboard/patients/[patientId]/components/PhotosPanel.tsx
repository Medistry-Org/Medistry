"use client";

/*
  Progress photos in the record (Arhaan's PhotosPanel), only while the patient shares them with
  their treating doctor: the first set beside the latest, front and side, with the weight logged
  that week. Hidden (blurred) until the doctor chooses to look; each look is logged in Activity.
*/

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { shortDate } from "@/lib/format/dateTime";
import type { ProgressPhotoSet } from "@/types/patientRecord";
import ProgressPhoto from "./ProgressPhoto";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import recordStyles from "../PatientRecordPage.module.css";
import styles from "./PhotosPanel.module.css";

const WEEK_MS = 7 * 864e5;

export default function PhotosPanel({
  sets,
  onShow,
}: {
  sets: ProgressPhotoSet[];
  onShow: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [all, setAll] = useState(false);
  const first = sets[0];
  const last = sets.length > 1 ? sets[sets.length - 1] : null;
  const list = all ? [...sets].reverse() : [first, ...(last ? [last] : [])];
  const weeks = last
    ? Math.max(
        1,
        Math.round(
          (Date.parse(last.takenAt) - Date.parse(first.takenAt)) / WEEK_MS,
        ),
      )
    : 0;
  const change =
    last && first.weightKg !== null && last.weightKg !== null
      ? last.weightKg - first.weightKg
      : null;

  return (
    <section
      id="photos"
      className={`${clinicStyles.panel} ${recordStyles.full}`}
      aria-labelledby="photos-heading"
    >
      <div className={clinicStyles.panelHead}>
        <h2 id="photos-heading" className={clinicStyles.h2}>
          Progress photos
        </h2>
        <span className={clinicStyles.muted}>
          Shared by the patient, every four weeks
        </span>
      </div>
      {shown ? (
        last && (
          <p className={styles.docSum}>
            First to latest: <span className="num">{weeks}</span> weeks
            {change !== null && (
              <>
                ,{" "}
                <span className="num">
                  {change > 0 ? "+" : "−"}
                  {Math.abs(change).toFixed(1)} kg
                </span>{" "}
                on the scale
              </>
            )}
            .
          </p>
        )
      ) : (
        <div className={styles.docGate}>
          <span>
            {sets.length} {sets.length === 1 ? "set" : "sets"}, hidden until you
            choose to look.
          </span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setShown(true);
              onShow();
            }}
          >
            <Eye size={17} aria-hidden="true" /> Show photos
          </button>
        </div>
      )}
      <div className={styles.docGrid}>
        {list.map((set, i) => (
          <div key={set.id} className={styles.docSet}>
            <ProgressPhoto
              set={set}
              pose="front"
              label={
                all
                  ? shortDate(set.takenAt)
                  : i === 0
                    ? "Start, front"
                    : "Latest, front"
              }
              hidden={!shown}
            />
            <ProgressPhoto
              set={set}
              pose="side"
              label={all ? "Side" : i === 0 ? "Start, side" : "Latest, side"}
              hidden={!shown}
            />
          </div>
        ))}
      </div>
      <div className={styles.docFoot}>
        <span className={clinicStyles.muted}>
          Viewing is recorded in Activity.
        </span>
        {shown && (
          <button
            type="button"
            className={clinicStyles.textLink}
            onClick={() => setShown(false)}
          >
            <EyeSlash size={15} aria-hidden="true" /> Hide
          </button>
        )}
        {sets.length > 2 && (
          <button
            type="button"
            className={clinicStyles.textLink}
            onClick={() => setAll((showing) => !showing)}
          >
            {all ? "First and latest" : `All ${sets.length} sets`}
          </button>
        )}
      </div>
    </section>
  );
}
