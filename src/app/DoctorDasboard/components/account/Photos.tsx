"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, Camera, CaretRight, Eye, EyeSlash, LockSimple, Trash, UserCircle } from "@phosphor-icons/react";
import { kgTo, useUnits, type WeightUnit } from "../tools/units";
import type { WeightLog } from "./api";
import { Segmented, short, useNow } from "./bits";
import { PhotoArt } from "./PhotoArt";
import {
  addSet,
  deleteAllPhotos,
  deleteSet,
  dueIn,
  EVERY_DAYS,
  prepare,
  setHide,
  setShared,
  startPhotos,
  usePhotos,
  usePhotoUrl,
  weightNear,
  type PhotoSet,
  type PhotoState,
  type Pose,
} from "./photo-store";
import Sheet from "./Sheet";
import { useToast, type AppData } from "./Shell";
import a from "./Account.module.css";
import x from "./App.module.css";
import l from "./Logs.module.css";
import f from "./Photos.module.css";
import ui from "./Ui.module.css";

const DAY = 864e5;
const POSES: { v: Pose; label: string }[] = [
  { v: "front", label: "Front" },
  { v: "side", label: "Side" },
];
const kg = (v: number, u: WeightUnit) => `${kgTo(v, u).toFixed(1)} ${u}`;
const diff = (v: number, u: WeightUnit) => {
  const n = Math.round(kgTo(v, u) * 10) / 10;
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)} ${u}`;
};
const weeksBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (7 * DAY)));

/** One picture: a stored photo, or a drawn sample in the prototype. Hidden ones are blurred. */
export function Pic({ src, pose, alt, hidden }: { src: string | null; pose: Pose; alt: string; hidden?: boolean }) {
  const url = usePhotoUrl(src);
  const sample = src?.startsWith("sample:");
  return (
    <span className={f.pic} data-hidden={hidden || undefined}>
      {sample ? (
        <PhotoArt pose={pose} g={src === "sample:0" ? 1 : 0.5} label={hidden ? "" : alt} />
      ) : url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={hidden ? "" : alt} draggable={false} />
      ) : (
        <PhotoArt pose={pose} guide />
      )}
      {sample && !hidden && <em className={f.sample}>Sample</em>}
    </span>
  );
}

/** "12 Sep, 76.9 kg" under a picture. */
function Caption({ label, set, w, u, base, date = true }: { label: string; set: PhotoSet; w: WeightLog[]; u: WeightUnit; base?: number | null; date?: boolean }) {
  const at = weightNear(w, set.taken_at);
  return (
    <span className={f.cap}>
      <strong>{label}</strong>
      <span>
        {date && <span className="num">{short(set.taken_at)}</span>}
        {at !== null && (
          <>
            {date && ", "}
            <span className="num">{kg(at, u)}</span>
            {base != null && Math.abs(at - base) >= 0.05 && <span className={`${f.delta} num`}> {diff(at - base, u)}</span>}
          </>
        )}
      </span>
    </span>
  );
}

/**
 * Progress photos on the Progress page. Before they are set up: a quiet, optional invitation at the
 * end of the page. After: the first set beside the latest, under the weight, hidden until tapped.
 */
export function PhotosCard({ data, className = "" }: { data: AppData; className?: string }) {
  const s = usePhotos();
  const units = useUnits();
  const u = units.weight;
  const now = useNow(60_000);
  const [sheet, setSheet] = useState<null | "setup" | "add" | "compare" | "all">(null);
  const [shown, setShown] = useState(false);
  const close = () => setSheet(null);
  if (!s) return null;

  const doctor = data.care?.doctor.name ?? null;
  const sets = s.sets;
  const first = sets[0];
  const last = sets.length > 1 ? sets.at(-1)! : null;
  const due = dueIn(s, now);
  const isDue = due !== null && due <= 0;
  const hidden = s.hide && !shown;
  const firstShot = data.care?.medication.some((m) => m.status === "TAKEN" && m.dose);

  const sheets = (
    <>
      <Sheet open={sheet === "setup"} onClose={close} title="Progress photos">
        {sheet === "setup" && <Setup doctor={doctor} before={!!data.care && !firstShot} onDone={() => setSheet("add")} />}
      </Sheet>
      <Sheet open={sheet === "add"} onClose={close} title={sets.length ? "Add photos" : "Starting photos"}>
        {sheet === "add" && <Capture s={s} w={data.weights} doctor={doctor} onDone={close} />}
      </Sheet>
      <Sheet open={sheet === "compare"} onClose={close} title="Compare photos">
        {sheet === "compare" && <Compare sets={sets} w={data.weights} u={u} />}
      </Sheet>
      <Sheet open={sheet === "all"} onClose={close} title="Photos">
        {sheet === "all" && <Manage s={s} w={data.weights} u={u} doctor={doctor} onEmpty={close} />}
      </Sheet>
    </>
  );

  if (!first) {
    return (
      <section className={`${f.card} ${ui.card} ${f.invite} ${className}`} data-photos="invite" aria-labelledby="ph-h">
        <div className={f.head}>
          <h2 id="ph-h" className={`${x.h2} ${ui.cardTitle}`}>
            Photos
          </h2>
          <span className={f.optional}>Optional</span>
        </div>
        <p className={f.lead}>
          A photo every four weeks shows changes the scale can miss. Private to you, and shared with your doctor only if you choose.
        </p>
        <button type="button" className={f.add} onClick={() => setSheet(s.started ? "add" : "setup")}>
          <Camera size={17} aria-hidden="true" />
          {s.started ? "Take starting photos" : "Set up photos"}
        </button>
        <div className={f.inviteArt} aria-hidden="true">
          <PhotoArt pose="front" guide g={0.7} />
          <PhotoArt pose="side" guide g={0.7} />
        </div>
        {sheets}
      </section>
    );
  }

  const base = weightNear(data.weights, first.taken_at);
  const nextOn = new Date(new Date(sets.at(-1)!.taken_at).getTime() + EVERY_DAYS * DAY).toISOString();
  const pair = (pose: Pose) => (
    <div className={f.pair} data-pose={pose}>
      <figure className={f.fig}>
        <Pic src={pose === "front" ? first.front : first.side} pose={pose} alt={`${pose === "front" ? "Front" : "Side"} view, ${short(first.taken_at)}`} hidden={hidden} />
        <figcaption>
          <Caption label="Start" set={first} w={data.weights} u={u} />
        </figcaption>
      </figure>
      {last ? (
        <figure className={f.fig}>
          <Pic src={pose === "front" ? last.front : last.side} pose={pose} alt={`${pose === "front" ? "Front" : "Side"} view, ${short(last.taken_at)}`} hidden={hidden} />
          <figcaption>
            <Caption label="Latest" set={last} w={data.weights} u={u} base={base} />
          </figcaption>
        </figure>
      ) : (
        // one set so far: the second frame says when the next belongs, and takes it
        <figure className={f.fig}>
          <button type="button" className={f.next} onClick={() => setSheet("add")} disabled={!isDue}>
            <PhotoArt pose={pose} guide />
            <span>
              <Camera size={18} aria-hidden="true" />
              {isDue ? "Take this month's" : <>Next set from <span className="num">{short(nextOn)}</span></>}
            </span>
          </button>
          <figcaption>
            <span className={f.cap}>
              <strong>Next</strong>
              <span>Every four weeks</span>
            </span>
          </figcaption>
        </figure>
      )}
      {hidden && (
        <button type="button" className={f.veil} data-one={!last || undefined} aria-label="Show photos" onClick={() => setShown(true)}>
          <span>
            <Eye size={18} aria-hidden="true" />
            {last ? "Show photos" : "Show"}
          </span>
        </button>
      )}
    </div>
  );

  return (
    <section className={`${f.card} ${ui.card} ${className}`} data-photos="used" aria-labelledby="ph-h">
      <div className={`${ui.cardHead} ${f.head}`}>
        <h2 id="ph-h" className={`${x.h2} ${ui.cardTitle}`}>
          Photos
        </h2>
        <button type="button" className={f.more} onClick={() => setSheet("all")}>
          {sets.length === 1 ? "1 set" : `All ${sets.length}`}
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>

      {/* the front views; side views are a tap away in Compare */}
      {pair("front")}

      <p className={f.privacy}>
        {s.shared ? <UserCircle size={16} aria-hidden="true" /> : <LockSimple size={16} aria-hidden="true" />}
        <span>{s.shared ? `Shared with ${doctor ?? "your doctor"}` : "Only you can see these"}</span>
        {s.hide && shown && (
          <button type="button" className={f.hideBtn} onClick={() => setShown(false)}>
            <EyeSlash size={15} aria-hidden="true" />
            Hide
          </button>
        )}
      </p>

      <div className={f.foot}>
        {last && (
          <button type="button" className={f.more} onClick={() => setSheet("compare")}>
            Compare
          </button>
        )}
        <button type="button" className={f.add} data-due={isDue || undefined} onClick={() => setSheet("add")}>
          <Camera size={17} aria-hidden="true" />
          {isDue ? (due! < 0 ? "Photos due" : "Photos due today") : "Add photos"}
        </button>
      </div>
      {sheets}
    </section>
  );
}

/* ---------- first time: what it is, and who sees it ---------- */

function Setup({ doctor, before, onDone }: { doctor: string | null; before: boolean; onDone: () => void }) {
  const [share, setShare] = useState(false);
  return (
    <div className={f.sheet}>
      <div className={f.setupArt} aria-hidden="true">
        <PhotoArt pose="front" guide g={0.7} />
        <PhotoArt pose="side" guide g={0.7} />
      </div>
      <p className={f.sheetLead}>
        Photos taken the same way every four weeks show what the scale can miss, like how your clothes fit and where you are losing.
      </p>
      <ul className={f.points}>
        <li>
          <LockSimple size={18} aria-hidden="true" />
          <span>
            <strong>Private to you.</strong> They stay hidden on screen until you tap them.
          </span>
        </li>
        <li>
          <Camera size={18} aria-hidden="true" />
          <span>
            <strong>Front and side, about a minute.</strong> Your face is optional; from the neck down is fine.
          </span>
        </li>
        <li>
          <Trash size={18} aria-hidden="true" />
          <span>
            <strong>Yours to delete.</strong> Any set, or all of them, whenever you like.
          </span>
        </li>
      </ul>
      <label className={f.share}>
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
        <span className={f.tick} aria-hidden="true" />
        <span>
          <strong>Share them with my doctor</strong>
          <span>
            {doctor ?? "Your doctor"} can look at them at your reviews, to see changes the scale misses. You can turn this off in photo settings.
          </span>
        </span>
      </label>
      <div className={l.dock}>
        {before && <p className={l.dockHint}>Best taken before your first injection, so you have a clear starting point.</p>}
        <button
          type="button"
          className={`btn ${a.go}`}
          onClick={() => {
            startPhotos(share);
            onDone();
          }}
        >
          <span>Take starting photos</span>
          <span className="well" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ---------- taking a set: front, side (optional), then save ---------- */

const GUIDE: Record<Pose, string> = {
  front: "Stand facing the camera, feet apart, arms relaxed at your sides.",
  side: "Turn to your right, arms relaxed at your sides.",
};

function Capture({ s, w, doctor, onDone }: { s: PhotoState; w: WeightLog[]; doctor: string | null; onDone: () => void }) {
  const toast = useToast();
  const units = useUnits();
  const [step, setStep] = useState<Pose | "review">("front");
  const [pics, setPics] = useState<Record<Pose, { blob: Blob; url: string } | null>>({ front: null, side: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const prev = s.sets.at(-1);
  const today = weightNear(w, new Date().toISOString());

  const pick = async (file: File | undefined) => {
    if (!file || step === "review") return;
    setErr(null);
    setBusy(true);
    try {
      const blob = await prepare(file);
      const url = URL.createObjectURL(blob);
      setPics((p) => {
        if (p[step]) URL.revokeObjectURL(p[step]!.url);
        return { ...p, [step]: { blob, url } };
      });
    } catch {
      setErr("That file could not be opened. Try a JPEG or HEIC photo.");
    }
    setBusy(false);
  };
  const choose = () => input.current?.click();

  if (step === "review") {
    return (
      <div className={f.sheet}>
        <p className={f.stepLine}>Check and save</p>
        <div className={f.reviewPair}>
          {(["front", "side"] as Pose[]).map((p) =>
            pics[p] ? (
              <figure key={p} className={f.fig}>
                <span className={f.pic}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pics[p]!.url} alt={`${p === "front" ? "Front" : "Side"} view, today`} />
                </span>
                <figcaption className={f.cap}>
                  <strong>{p === "front" ? "Front" : "Side"}</strong>
                  <button type="button" className={f.retake} onClick={() => setStep(p)}>
                    Retake
                  </button>
                </figcaption>
              </figure>
            ) : (
              <figure key={p} className={f.fig}>
                <button type="button" className={f.next} onClick={() => setStep(p)}>
                  <PhotoArt pose={p} guide />
                  <span>
                    <Camera size={18} aria-hidden="true" />
                    Add a side view
                  </span>
                </button>
              </figure>
            ),
          )}
        </div>
        <ul className={f.facts}>
          <li>
            {today !== null ? (
              <>
                Saved with this week&rsquo;s weight, <span className="num">{kg(today, units.weight)}</span>.
              </>
            ) : (
              "No weight logged this week. Log one and these photos carry it."
            )}
          </li>
          <li>{s.shared ? `${doctor ?? "Your doctor"} will see them. Change this in photo settings.` : "Only you will see them."}</li>
          <li>Location and other hidden details in the file are removed.</li>
        </ul>
        <div className={l.dock}>
          <button
            type="button"
            className={`btn ${a.go}`}
            data-busy={busy}
            onClick={async () => {
              if (!pics.front || busy) return;
              setBusy(true);
              try {
                const id = await addSet(pics.front.blob, pics.side?.blob ?? null);
                toast("Photos saved", () => deleteSet(id));
                onDone();
              } catch {
                setErr("These could not be saved on this phone. Free some space and try again.");
                setBusy(false);
              }
            }}
          >
            <span>{busy ? "Saving" : "Save photos"}</span>
            <span className="well" aria-hidden="true">
              {busy ? <i className={a.spin} /> : <ArrowRight size={18} />}
            </span>
          </button>
          {err && (
            <p className={l.dockHint} role="alert">
              {err}
            </p>
          )}
        </div>
      </div>
    );
  }

  const pose = step;
  const got = pics[pose];
  const last = prev ? (pose === "front" ? prev.front : prev.side) : null;
  return (
    <div className={f.sheet}>
      <p className={f.stepLine}>
        <span className="num">{pose === "front" ? 1 : 2}</span> of <span className="num">2</span>, {pose === "front" ? "front view" : "side view"}
      </p>
      <div className={f.shoot} data-last={!!last || undefined}>
        <button type="button" className={f.frame} onClick={choose} aria-label={got ? `Change the ${pose} photo` : `Choose or take the ${pose} photo`}>
          {got ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={got.url} alt="" />
          ) : (
            <PhotoArt pose={pose} guide />
          )}
        </button>
        {last && (
          <figure className={f.lastTime}>
            <Pic src={last} pose={pose} alt={`Last time, ${short(prev!.taken_at)}`} />
            <figcaption>
              Last time, <span className="num">{short(prev!.taken_at)}</span>. Stand the same way.
            </figcaption>
          </figure>
        )}
      </div>
      <p className={f.guide}>{GUIDE[pose]} Same spot and light each time, in fitted clothes. Use a timer, or ask someone to take it.</p>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => {
        void pick(e.target.files?.[0]);
        e.target.value = "";
      }} />
      <div className={l.dock}>
        {got ? (
          <button type="button" className={`btn ${a.go}`} onClick={() => setStep(pose === "front" && !pics.side ? "side" : "review")}>
            <span>{pose === "front" && !pics.side ? "Next: side view" : "Done"}</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </button>
        ) : (
          <button type="button" className={`btn ${a.go}`} onClick={choose} data-busy={busy}>
            <span>{busy ? "Opening" : "Take or choose a photo"}</span>
            <span className="well" aria-hidden="true">
              {busy ? <i className={a.spin} /> : <Camera size={18} />}
            </span>
          </button>
        )}
        {got && (
          <button type="button" className={`btn btn--ghost ${f.wide}`} onClick={choose}>
            Retake
          </button>
        )}
        {!got && pose === "side" && (
          <button type="button" className={`btn btn--ghost ${f.wide}`} onClick={() => setStep("review")}>
            Skip, front only
          </button>
        )}
        {err && (
          <p className={l.dockHint} role="alert">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- comparing any two sets ---------- */

function Compare({ sets, w, u }: { sets: PhotoSet[]; w: WeightLog[]; u: WeightUnit }) {
  const [pose, setPose] = useState<Pose>("front");
  const [from, setFrom] = useState(sets[0].id);
  const [to, setTo] = useState(sets.at(-1)!.id);
  const A = sets.find((x) => x.id === from) ?? sets[0];
  const B = sets.find((x) => x.id === to) ?? sets.at(-1)!;
  const wa = weightNear(w, A.taken_at);
  const wb = weightNear(w, B.taken_at);
  const hasSide = sets.some((x) => x.side);
  const pick = (label: string, v: string, set: (v: string) => void, other: string) => (
    <label className={f.pick}>
      <span>{label}</span>
      <select value={v} onChange={(e) => set(e.target.value)}>
        {sets.map((x) => (
          <option key={x.id} value={x.id} disabled={x.id === other}>
            {short(x.taken_at)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className={f.sheet}>
      {hasSide && (
        <div className={f.seg}>
          <Segmented label="View" value={pose} onChange={setPose} options={POSES} />
        </div>
      )}
      <div className={f.picks}>
        {pick("From", from, setFrom, to)}
        {pick("To", to, setTo, from)}
      </div>
      <div className={f.reviewPair}>
        {[A, B].map((set, i) => {
          const src = pose === "front" ? set.front : set.side;
          return (
            <figure key={set.id + i} className={f.fig}>
              {src ? <Pic src={src} pose={pose} alt={`${pose === "front" ? "Front" : "Side"} view, ${short(set.taken_at)}`} /> : <span className={`${f.pic} ${f.none}`}>No side view this time</span>}
              <figcaption>
                <Caption label={short(set.taken_at)} set={set} w={w} u={u} date={false} />
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className={f.between}>
        <span className="num">{weeksBetween(A.taken_at, B.taken_at)}</span> {weeksBetween(A.taken_at, B.taken_at) === 1 ? "week" : "weeks"} apart
        {wa !== null && wb !== null && (
          <>
            , <span className="num">{diff(wb - wa, u)}</span> on the scale
          </>
        )}
        .
      </p>
    </div>
  );
}

/* ---------- every set, and the settings ---------- */

function Toggle({ label, line, on, onChange }: { label: string; line: ReactNode; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <li>
      <label className={x.toggleRow}>
        <span>
          <strong>{label}</strong>
          <span>{line}</span>
        </span>
        <span className={x.switch}>
          <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
          <i aria-hidden="true" />
        </span>
      </label>
    </li>
  );
}

function Manage({ s, w, u, doctor, onEmpty }: { s: PhotoState; w: WeightLog[]; u: WeightUnit; doctor: string | null; onEmpty: () => void }) {
  const toast = useToast();
  const [shown, setShown] = useState(!s.hide);
  const [sure, setSure] = useState<string | null>(null);
  const list = [...s.sets].reverse();
  return (
    <div className={`${f.sheet} ${x.acct}`}>
      <section className={x.acctGroup} aria-labelledby="ph-sets">
        <div className={f.groupHead}>
          <h3 id="ph-sets" className={x.subHead}>
            Your photos
          </h3>
          {s.hide && (
            <button type="button" className={f.hideBtn} onClick={() => setShown((v) => !v)}>
              {shown ? <EyeSlash size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
              {shown ? "Hide" : "Show"}
            </button>
          )}
        </div>
        <ul className={f.sets}>
          {list.map((set) => {
            const at = weightNear(w, set.taken_at);
            return (
              <li key={set.id}>
                <span className={f.thumbs}>
                  <Pic src={set.front} pose="front" alt={`Front view, ${short(set.taken_at)}`} hidden={!shown} />
                  {set.side && <Pic src={set.side} pose="side" alt={`Side view, ${short(set.taken_at)}`} hidden={!shown} />}
                </span>
                <span className={f.setMain}>
                  <strong className="num">{short(set.taken_at)}</strong>
                  <span>
                    {set.side ? "Front and side" : "Front"}
                    {at !== null && (
                      <>
                        , <span className="num">{kg(at, u)}</span>
                      </>
                    )}
                  </span>
                </span>
                {sure === set.id ? (
                  <span className={x.pair}>
                    <button type="button" className={x.pairBtn} onClick={() => setSure(null)}>
                      Keep
                    </button>
                    <button
                      type="button"
                      className={`${x.pairBtn} ${f.calmGo}`}
                      onClick={() => {
                        const empty = s.sets.length === 1;
                        deleteSet(set.id);
                        setSure(null);
                        toast("Set deleted");
                        if (empty) onEmpty();
                      }}
                    >
                      Delete
                    </button>
                  </span>
                ) : (
                  <button type="button" className={f.bin} onClick={() => setSure(set.id)} aria-label={`Delete the set from ${short(set.taken_at)}`}>
                    <Trash size={18} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={x.acctGroup} aria-labelledby="ph-set">
        <h3 id="ph-set" className={x.subHead}>
          Settings
        </h3>
        <ul className={x.toggles}>
          <Toggle
            label="Share with my doctor"
            line={s.shared ? `${doctor ?? "Your doctor"} sees every set` : "Only you see them"}
            on={s.shared}
            onChange={(v) => {
              setShared(v);
              toast(v ? "Shared with your doctor" : "No longer shared");
            }}
          />
          <Toggle label="Hide until tapped" line="Blurred on screen until you choose to see them" on={s.hide} onChange={setHide} />
        </ul>
      </section>

      {sure === "all" ? (
        <div className={`${x.confirm} ${f.calm}`} role="group" aria-label="Confirm deleting every photo">
          <p>
            <strong>Delete all {s.sets.length} sets?</strong> They are removed for good{s.shared ? ", and your doctor no longer sees them" : ""}.
          </p>
          <div className={x.pair}>
            <button type="button" className={x.pairBtn} onClick={() => setSure(null)}>
              Keep them
            </button>
            <button
              type="button"
              className={`${x.pairBtn} ${f.calmGo}`}
              onClick={() => {
                deleteAllPhotos();
                toast("All photos deleted");
                onEmpty();
              }}
            >
              Delete all
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={f.dropAll} onClick={() => setSure("all")}>
          <Trash size={17} aria-hidden="true" />
          Delete all photos
        </button>
      )}
    </div>
  );
}
