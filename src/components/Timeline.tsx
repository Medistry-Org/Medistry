"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mask, Tag } from "./ui";
import s from "./Timeline.module.css";

gsap.registerPlugin(ScrollTrigger);

const EVENTS = [
  {
    when: "Two minutes, free",
    title: "An eligibility check",
    body: "Your weight history, health conditions, current medicines and goals. A doctor reads every answer, and nothing is paid.",
  },
  {
    when: "15 minutes, free",
    title: "Your first consultation",
    body: "On a secure video call with a registered doctor, who goes through your history with you and decides whether treatment fits.",
  },
  {
    when: "After your review",
    title: "Your plan, paid upfront",
    body: "Choose a 1, 4, 6 or 12-month plan and see the full price before you pay. Medicine, only if your doctor prescribes it, arrives sealed at your door.",
  },
  {
    when: "Week one",
    title: "Blood tests and a guided start",
    body: "A partner lab collects samples at home, and the results go straight into your record. Short videos in the app walk you through your first days.",
  },
  {
    when: "Every week",
    title: "A one-minute check-in",
    body: "Weight, meals and how you are feeling, logged in the app or sent on WhatsApp. Your care team replies within the day.",
  },
  {
    when: "Every 14 days",
    title: "Doctor reviews",
    body: "Your doctor reviews your readings and adjusts the plan as they change.",
  },
  {
    when: "When you are ready",
    title: "Maintenance",
    body: (
      <>
        When you and your doctor agree, the plan moves to a lighter maintenance rhythm, with fewer{" "}
        <span style={{ whiteSpace: "nowrap" }}>check-ins</span> and the same doctor.
      </>
    ),
  },
];

// Care cadence over 26 weeks: what you send, and how the team answers.
// a label gutter on the left: "You", "Your care team", "Week" and the legend share x = 0
const W0 = 120;
const W1 = 960;
const WEEKS = 26;
const wx = (w: number) => W0 + (w / WEEKS) * (W1 - W0);
const RAIL = 96;
const YOU = 262;
const TEAM = 420;
// weekly while the plan is active, fortnightly once maintenance begins
const CHECKINS = [...Array.from({ length: 21 }, (_, i) => i + 1), 23, 25];
const REVIEWS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24];
const LABS = [0.6, 12, 24];
// the band has a soft left edge: its timing is set with your doctor, not by the calendar
const MAINT = 21;
// Each step owns a span of real weeks; the "now" line only moves within the
// active step's span, so the highlighted step and the line always agree.
// The first three steps all happen in week 0.
const SPANS: [number, number][] = [
  [0, 0.15],
  [0.15, 0.35],
  [0.35, 0.6],
  [0.6, 1.5],
  [1.5, 10],
  [10, 20],
  [20, 26],
];
// Scroll share per step: the week-0 steps pass quickly, the long stretches get
// more room, so the "now" line keeps moving at a steady, readable pace.
const WEIGHTS = [0.7, 0.7, 0.7, 0.9, 1.4, 1.4, 1.2];
const TOTAL = WEIGHTS.reduce((a, w) => a + w, 0);
const CUM = WEIGHTS.reduce<number[]>((a, w) => [...a, a[a.length - 1] + w / TOTAL], [0]);
const weekAt = (p: number) => {
  const q = Math.min(0.9999, Math.max(0, p));
  let i = 0;
  while (i < WEIGHTS.length - 1 && q >= CUM[i + 1]) i++;
  const f = (q - CUM[i]) / (CUM[i + 1] - CUM[i]);
  const [a, b] = SPANS[i];
  return { i, f, week: a + (b - a) * f };
};

function Cadence({ lit = false }: { lit?: boolean }) {
  const c = lit ? s.lit : s.dim;
  return (
    <g className={c}>
      {CHECKINS.map((w) => (
        <line key={`c${w}`} x1={wx(w)} x2={wx(w)} y1={YOU + 8} y2={TEAM - 8} className={s.link} />
      ))}
      {CHECKINS.map((w) => (
        <circle key={`y${w}`} cx={wx(w)} cy={YOU} r="6" className={s.you} />
      ))}
      {CHECKINS.map((w) => (
        <circle key={`t${w}`} cx={wx(w)} cy={TEAM} r="4" className={s.reply} />
      ))}
      {REVIEWS.map((w) => (
        <circle key={`r${w}`} cx={wx(w)} cy={TEAM} r="11" className={s.review} />
      ))}
      {LABS.map((w) => (
        <rect key={`l${w}`} x={wx(w) - 7} y={TEAM + 34} width="14" height="14" rx="3" className={s.lab} />
      ))}
    </g>
  );
}

export default function Timeline() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mm = gsap.matchMedia();
    const now = el.querySelector<SVGRectElement>("[data-now]")!;
    const setNow = (x: number) => now.setAttribute("width", String(x));

    const steps = Array.from(el.querySelectorAll<HTMLButtonElement>("[data-step]"));
    const setActive = (i: number, collapse = false) => {
      el.dataset.active = String(i);
      el.querySelectorAll<HTMLElement>("[data-ev]").forEach((n) => n.toggleAttribute("data-on", Number(n.dataset.ev) <= i));
      el.querySelectorAll<HTMLElement>("[data-ev]").forEach((n) => n.toggleAttribute("data-current", Number(n.dataset.ev) === i));
      // on desktop only the current step is open; on mobile every step stays readable
      steps.forEach((b, k) => {
        if (collapse) b.setAttribute("aria-expanded", String(k === i));
        b.toggleAttribute("aria-current", collapse && k === i);
        const body = document.getElementById(`step-${k}`);
        if (body) body.inert = collapse && k !== i;
      });
    };
    // where the steps are not interactive, they are plain headings to assistive tech
    const passive = () => {
      steps.forEach((b) => {
        b.removeAttribute("aria-expanded");
        b.removeAttribute("aria-current");
        b.tabIndex = -1;
        const body = document.getElementById(`step-${b.dataset.step}`);
        if (body) body.inert = false;
      });
      return () => steps.forEach((b) => b.removeAttribute("tabindex"));
    };

    mm.add("(min-width: 1024px)", () => {
      if (reduce) {
        setNow(1000);
        el.dataset.static = "1";
        setActive(EVENTS.length - 1);
        const restore = passive();
        return () => {
          delete el.dataset.static;
          restore();
        };
      }
      const stage = el.querySelector<HTMLElement>("[data-stage]")!;
      const cursor = el.querySelector<HTMLElement>("[data-cursor]")!;
      const bars = Array.from(el.querySelectorAll<HTMLElement>("[data-prog]"));
      const st = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${window.innerHeight * 3}`,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const { i: idx, f: within, week } = weekAt(self.progress);
          const x = wx(week) + 8;
          setNow(x);
          cursor.style.left = `${x / 10}%`;
          if (el.dataset.active !== String(idx)) setActive(idx, true);
          // how far through the current step you are, drawn beside it
          bars.forEach((b, k) => (b.style.transform = `scaleY(${k < idx ? 1 : k === idx ? within : 0})`));
        },
      });
      setActive(0, true);
      setNow(W0);

      // Clicking a step glides the page to it, so the chart animates there too.
      const lenis = (window as unknown as { __lenis?: { scrollTo(y: number, o?: object): void } }).__lenis;
      const go = (e: Event) => {
        const i = Number((e.currentTarget as HTMLElement).dataset.step);
        const y = st.start + (CUM[i] + 0.12 * (CUM[i + 1] - CUM[i])) * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      };
      // keyboard focus moves the chart too, so Tab alone walks the stages
      const onFocus = (e: FocusEvent) => {
        if ((e.currentTarget as HTMLElement).matches(":focus-visible")) go(e);
      };
      steps.forEach((b) => {
        b.addEventListener("click", go);
        b.addEventListener("focus", onFocus);
      });
      return () => {
        st.kill();
        steps.forEach((b) => {
          b.removeEventListener("click", go);
          b.removeEventListener("focus", onFocus);
        });
      };
    });

    mm.add("(max-width: 1023px)", () => {
      setNow(1000);
      const restore = passive();
      const rail = el.querySelector<HTMLElement>("[data-rail]")!;
      const list = el.querySelector<HTMLElement>("[data-list]")!;
      const last = list.lastElementChild as HTMLElement;
      const fit = () => list.parentElement!.style.setProperty("--tail", `${last.offsetHeight - 11.5}px`);
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(last);
      if (reduce) {
        setActive(EVENTS.length - 1);
        return () => {
          ro.disconnect();
          restore();
        };
      }
      const tw = gsap.fromTo(
        rail,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el.querySelector("[data-list]"),
            start: "top 70%",
            end: "bottom 70%",
            scrub: 0.6,
            onUpdate: (self) => {
              const idx = Math.min(EVENTS.length - 1, Math.floor(self.progress * EVENTS.length));
              if (el.dataset.active !== String(idx)) setActive(idx);
            },
          },
        },
      );
      setActive(0);
      return () => {
        tw.scrollTrigger?.kill();
        ro.disconnect();
        restore();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="how" ref={root} className={s.how} aria-labelledby="how-title" data-active="0">
      <div data-stage className={s.stage}>
        <div className={`wrap ${s.inner}`}>
          <div className={s.head}>
            <Tag>How it works</Tag>
            <Mask id="how-title" className="h2" lines={["What the first", "months look like."]} />
            <p className={`lede ${s.lede}`} data-reveal="rise">
              One care team and one record, from your first questionnaire to maintenance. At every stage you know what comes
              next and who is responsible for it.
            </p>
          </div>

          <figure className={s.chart}>
            <div className={s.plot} aria-hidden="true">
            <svg viewBox="0 0 1000 600" className={s.svg}>
              <defs>
                <clipPath id="tl-now">
                  <rect data-now x="0" y="0" width="0" height="600" />
                </clipPath>
              </defs>
              <defs>
                <linearGradient id="tl-maint" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--mint-wash)" stopOpacity="0" />
                  <stop offset=".35" stopColor="var(--mint-wash)" />
                </linearGradient>
              </defs>
              <rect x={wx(MAINT) - 40} y={RAIL + 44} width={W1 - wx(MAINT) + 60} height={TEAM - RAIL + 30} rx="10" fill="url(#tl-maint)" />
              {/* labels sit above the band, where the "now" line never reaches */}
              <text x={W1 + 20} y={RAIL + 30} textAnchor="end" className={s.maintLabel}>
                Maintenance<tspan className={s.maintSub}>, timing set with your doctor</tspan>
              </text>
              <line x1={W0} x2={W1} y1={YOU} y2={YOU} className={s.lane0} />
              <line x1={W0} x2={W1} y1={TEAM} y2={TEAM} className={s.lane0} />
              <text x="0" y={YOU} dominantBaseline="middle" className={s.lane}>
                You
              </text>
              <text x="0" y={TEAM} dominantBaseline="middle" className={`${s.lane} ${s.laneLong}`}>
                Care team
              </text>
              <text x="0" y={TEAM} dominantBaseline="middle" className={`${s.lane} ${s.laneShort}`}>
                Team
              </text>
              <Cadence />
              <g clipPath="url(#tl-now)" data-lit-layer>
                <Cadence lit />
              </g>
              <text x="0" y="572" className={s.week}>
                Week
              </text>
              {[0, 4, 8, 12, 16, 20, 24].map((w) => (
                <text key={w} x={wx(w)} y="572" textAnchor="middle" className={s.week}>
                  {w}
                </text>
              ))}
            </svg>
            <div className={s.dots}>
              <span data-cursor className={s.cursor} style={{ left: `${W0 / 10}%` }} />
            </div>
            </div>
            <ul className={s.key} aria-hidden="true">
              <li><i className={s.kYou} /> Your weekly check-in</li>
              <li><i className={s.kReply} /> Coach reply</li>
              <li><i className={s.kReview} /> Doctor review</li>
              <li><i className={s.kLab} /> Blood tests</li>
            </ul>
            <figcaption className={s.note}>An example schedule. Your doctor sets the exact rhythm.</figcaption>
          </figure>

          <div className={s.listWrap}>
            <span className={s.railTrack} aria-hidden="true">
              <span data-rail className={s.rail} />
            </span>
            <ol data-list className={s.list}>
              {EVENTS.map((e, i) => (
                <li key={e.title} data-ev={i} className={s.ev}>
                  <span className={s.prog} aria-hidden="true">
                    <i data-prog />
                  </span>
                  <h3 className={s.stepHead}>
                    <button type="button" data-step={i} aria-expanded="true" aria-controls={`step-${i}`} className={s.stepBtn}>
                      <span className={s.when}>{e.when}</span>
                      <span className={s.title}>{e.title}</span>
                    </button>
                  </h3>
                  <div id={`step-${i}`} className={s.bodyWrap}>
                    <div>
                      <p className={s.body}>{e.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
