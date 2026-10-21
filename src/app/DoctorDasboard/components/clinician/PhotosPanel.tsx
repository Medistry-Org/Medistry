"use client";

import { useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import { short } from "../account/bits";
import { Pic } from "../account/Photos";
import { usePhotos, weightNear, type PhotoSet, type Pose } from "../account/photo-store";
import type { Patient } from "./data";
import c from "./Clinic.module.css";
import f from "../account/Photos.module.css";

/**
 * The sample patient's photos, while she shares them. In the product this is GET
 * /api/v1/patients/{id}/photos, which answers only the treating doctor and only while sharing is on.
 */
export function usePatientPhotos(pid: string): PhotoSet[] | null {
  const s = usePhotos();
  if (pid !== "p_aanya" || !s?.shared || !s.sets.length) return null;
  return s.sets;
}

/**
 * Progress photos in the record: the first set beside the latest, front and side, with the weight
 * logged that week. Hidden until the doctor chooses to look; each look is written to the activity log.
 */
export function PhotosPanel({ p, sets, onShow }: { p: Patient; sets: PhotoSet[]; onShow: () => void }) {
  const [shown, setShown] = useState(false);
  const [all, setAll] = useState(false);
  const w = p.weights.map((x) => ({ logged_at: x.at, weight_kg: x.kg }));
  const first = sets[0];
  const last = sets.length > 1 ? sets.at(-1)! : null;
  const list = all ? [...sets].reverse() : [first, ...(last ? [last] : [])];
  const cell = (set: PhotoSet, pose: Pose, label: string) => {
    const src = pose === "front" ? set.front : set.side;
    const kg = weightNear(w, set.taken_at);
    return (
      <figure key={set.id + pose} className={f.docFig}>
        {src ? <Pic src={src} pose={pose} alt={`${pose === "front" ? "Front" : "Side"} view, ${short(set.taken_at)}`} hidden={!shown} /> : <span className={`${f.pic} ${f.none}`}>No side view</span>}
        <figcaption className={f.cap}>
          <strong>{label}</strong>
          <span>
            <span className="num">{short(set.taken_at)}</span>
            {kg !== null && (
              <>
                , <span className="num">{kg.toFixed(1)} kg</span>
              </>
            )}
          </span>
        </figcaption>
      </figure>
    );
  };
  return (
    <section id="photos" className={`${c.panel} ${c.full}`} aria-labelledby="ph-dh">
      <div className={c.panelHead}>
        <h2 id="ph-dh" className={c.h2}>
          Progress photos
        </h2>
        <span className={c.muted}>Shared by the patient, every four weeks</span>
      </div>
      {shown ? (
        last && (
          <p className={f.docSum}>
            {(() => {
              const a = weightNear(w, first.taken_at);
              const b = weightNear(w, last.taken_at);
              const wk = Math.max(1, Math.round((Date.parse(last.taken_at) - Date.parse(first.taken_at)) / (7 * 864e5)));
              return (
                <>
                  First to latest: <span className="num">{wk}</span> weeks
                  {a !== null && b !== null && (
                    <>
                      , <span className="num">{b - a > 0 ? "+" : "\u2212"}{Math.abs(b - a).toFixed(1)} kg</span> on the scale
                    </>
                  )}
                  .
                </>
              );
            })()}
          </p>
        )
      ) : (
        <div className={f.docGate}>
          <span>
            {sets.length} {sets.length === 1 ? "set" : "sets"}, hidden until you choose to look.
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
      <div className={f.docGrid}>
        {list.map((set, i) => (
          <div key={set.id} className={f.docSet}>
            {cell(set, "front", all ? short(set.taken_at) : i === 0 ? "Start, front" : "Latest, front")}
            {cell(set, "side", all ? "Side" : i === 0 ? "Start, side" : "Latest, side")}
          </div>
        ))}
      </div>
      <div className={f.docFoot}>
        <span className={c.muted}>Viewing is recorded in Activity.</span>
        {shown && (
          <button type="button" className={c.textLink} onClick={() => setShown(false)}>
            <EyeSlash size={15} aria-hidden="true" /> Hide
          </button>
        )}
        {sets.length > 2 && (
          <button type="button" className={c.textLink} onClick={() => setAll((v) => !v)}>
            {all ? "First and latest" : `All ${sets.length} sets`}
          </button>
        )}
      </div>
    </section>
  );
}
