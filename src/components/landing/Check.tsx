"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRight, LockSimple, Stethoscope } from "@phosphor-icons/react";
import { ASSESSMENT_URL, Art, Mask, Tag } from "./ui";
import s from "./Check.module.css";

type Sex = "woman" | "man";

const AXIS = { min: 15, max: 40 };
const pct = (v: number) => ((Math.min(AXIS.max, Math.max(AXIS.min, v)) - AXIS.min) / (AXIS.max - AXIS.min)) * 100;

const INDIAN = [
  { from: 0, to: 18.5, label: "Underweight" },
  { from: 18.5, to: 23, label: "Healthy" },
  { from: 23, to: 25, label: "Overweight" },
  { from: 25, to: Infinity, label: "Obesity" },
];
const GLOBAL = [
  { from: 0, to: 18.5, label: "Underweight" },
  { from: 18.5, to: 25, label: "Healthy" },
  { from: 25, to: 30, label: "Overweight" },
  { from: 30, to: Infinity, label: "Obesity" },
];

function band(b: number, table: typeof INDIAN) {
  return table.findIndex((t) => b >= t.from && b < t.to);
}

function Ruler({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={s.field}>
      <div className={s.fieldHead}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="num">
          {value}
          <span>{unit}</span>
        </output>
      </div>
      <div
        className={s.rangeWrap}
        style={
          {
            "--fill": fill / 100,
            "--major": (max - min) / 10,
            "--minor": (max - min) / 2,
          } as React.CSSProperties
        }
      >
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-valuetext={`${value} ${unit === "cm" ? "centimetres" : "kilograms"}`}
          onChange={(e) => onChange(Number(e.target.value))}
          className={s.range}
        />
      </div>
      <div className={s.scaleEnds} aria-hidden="true">
        <span className="num">{min}</span>
        <span className="num">{max}</span>
      </div>
    </div>
  );
}

export default function Check() {
  const [sex, setSex] = useState<Sex>("woman");
  const [height, setHeight] = useState(162);
  const [weight, setWeight] = useState(71);
  const [waist, setWaist] = useState(88);

  const r = useMemo(() => {
    // categorise the number the visitor actually sees
    const bmi = Math.round((weight / (height / 100) ** 2) * 10) / 10;
    const whtr = waist / height;
    const waistLimit = sex === "man" ? 90 : 80;
    const ib = band(bmi, INDIAN);
    const gb = band(bmi, GLOBAL);
    const waistHigh = waist >= waistLimit;
    let verdict: string;
    if (bmi < 18.5) verdict = "Your BMI is below the healthy range. This programme is built for people above it.";
    else if (bmi < 23)
      verdict = waistHigh
        ? "Your BMI is in the healthy range, but your waist is above the Indian threshold. Fat around the middle can carry risk even at a healthy weight."
        : "Your BMI and waist are both within the healthy range for Asian Indians.";
    else if (bmi < 25) verdict = "By Indian guidance this is overweight. The global chart would still call it healthy.";
    else if (bmi < 30) verdict = "By Indian guidance this falls in the obesity range. The global chart would only call it overweight.";
    else verdict = "This falls in the obesity range on both the Indian and the global charts.";
    if (bmi >= 23 && waistHigh) verdict += ` Your waist is also above the ${waistLimit}\u00a0cm threshold.`;
    return { bmi, whtr, waistLimit, ib, gb, waistHigh, verdict, under: bmi < 18.5 };
  }, [sex, height, weight, waist]);

  return (
    <section id="check" className={`section ${s.check}`} aria-labelledby="check-title">
      <Art kind="ticks" className={s.art} />
      <Art kind="arcs" className={s.arcs} />
      <div className={`wrap ${s.grid}`}>
        <div className={s.intro}>
          <Tag>Your risk, by Indian thresholds</Tag>
          <Mask id="check-title" className="h2" lines={["For Indians, risk", "starts at a lower BMI."]} />
          <p className="lede" data-reveal="rise" style={{ "--d": "200ms" } as React.CSSProperties}>
            Clinical guidance for Asian Indians sets lower thresholds for BMI and waist size than the global charts, because the
            risk of diabetes and heart disease starts earlier.
          </p>
          <p className={s.source} data-reveal="rise" style={{ "--d": "300ms" } as React.CSSProperties}>
            Thresholds from the consensus statement on obesity in Asian Indians (Misra et al., 2009): BMI 23 for overweight, 25
            for obesity, and a waist of 80&nbsp;cm for women or 90&nbsp;cm for men.
          </p>
        </div>

        <div className={s.instrument} data-reveal="rise" style={{ "--d": "120ms" } as React.CSSProperties}>
          <div className={s.controls}>
            <div
              className={s.seg}
              role="radiogroup"
              aria-label="Sex, for waist thresholds"
              onKeyDown={(e) => {
                if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
                e.preventDefault();
                const next: Sex = sex === "woman" ? "man" : "woman";
                setSex(next);
                (e.currentTarget.querySelector(`[data-v="${next}"]`) as HTMLElement | null)?.focus();
              }}
            >
              {(["woman", "man"] as Sex[]).map((v) => (
                <button
                  key={v}
                  data-v={v}
                  role="radio"
                  aria-checked={sex === v}
                  tabIndex={sex === v ? 0 : -1}
                  onClick={() => setSex(v)}
                  className={s.segBtn}
                >
                  {v === "woman" ? "Woman" : "Man"}
                </button>
              ))}
              <span className={s.segThumb} data-at={sex} aria-hidden="true" />
            </div>
            <Ruler label="Height" unit="cm" value={height} min={140} max={200} onChange={setHeight} />
            <Ruler label="Weight" unit="kg" value={weight} min={40} max={150} onChange={setWeight} />
            <Ruler label="Waist, at the navel" unit="cm" value={waist} min={60} max={140} onChange={setWaist} />
          </div>

          <div className={s.readout}>
            <div className={s.bmiRow}>
              <div>
                <p className={s.k}>Body mass index</p>
                <p className={s.bmi}>{r.bmi.toFixed(1)}</p>
              </div>
              <div className={s.whtr}>
                <p className={s.k}>Waist to height</p>
                <p className={`num ${s.whtrVal}`}>
                  {r.whtr.toFixed(2)}
                </p>
              </div>
            </div>

            <div className={s.chart} role="img" aria-label={`BMI ${r.bmi.toFixed(1)} on the Indian and global scales`}>
              {[
                { name: "Indian guidance", table: INDIAN, at: r.ib },
                { name: "Global chart", table: GLOBAL, at: r.gb },
              ].map((row) => (
                <div className={s.row} key={row.name}>
                  <p className={s.rowName}>
                    <span>{row.name}</span>
                    <strong>{row.at >= 0 ? row.table[row.at].label : ""}</strong>
                  </p>
                  <div className={s.trackWrap}>
                  <div className={s.track}>
                    {row.table.map((b, i) => (
                      <div
                        key={b.label}
                        className={s.band}
                        data-level={i}
                        data-on={row.at === i}
                        style={{ left: `${pct(b.from)}%`, width: `${pct(b.to) - pct(b.from)}%` }}
                      />
                    ))}
                  </div>
                  <span className={s.marker} style={{ "--x": `${pct(r.bmi)}%` } as React.CSSProperties} aria-hidden="true" />
                  </div>
                </div>
              ))}
              <div className={s.axis} aria-hidden="true">
                {[18.5, 23, 25, 30].map((t) => (
                  <span key={t} className="num" style={{ left: `${pct(t)}%` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <p className={s.verdict} aria-live="polite">
              {r.verdict}
            </p>

            <div className={s.next}>
              {r.under ? (
                <p className={s.under}>Weight below the healthy range deserves a conversation with your own doctor.</p>
              ) : (
                <a href={ASSESSMENT_URL} className={`btn ${s.go}`}>
                  <span>Start free check</span>
                  <span className="well" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                </a>
              )}
              <ul className={s.assure}>
                <li>
                  <span className={s.badge} aria-hidden="true">
                    <LockSimple size={15} />
                  </span>
                  Private to this device
                </li>
                <li>
                  <span className={s.badge} aria-hidden="true">
                    <Stethoscope size={15} />
                  </span>
                  Only a doctor can diagnose
                </li>
              </ul>
              <p className={`fineprint ${s.disclaim}`}>
                Results vary between individuals. For adults aged 18 and over, and not for emergencies. Care is provided by
                registered medical practitioners, and video consultations follow the Telemedicine Practice Guidelines, 2020.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
