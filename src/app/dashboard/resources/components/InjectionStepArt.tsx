/*
  The line drawing for one injection step (Arhaan Guides.tsx Art), in the brand's instrument
  style: where to inject, the pen with its needle or dial, the right angle, and the sharps bottle.
*/

import type { Step } from "../content/guideContent";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";

export default function InjectionStepArt({ kind }: { kind: Step["art"] }) {
  const common = { className: surfaceStyles.stepArt, viewBox: "0 0 240 160", "aria-hidden": true, fill: "none" } as const;
  if (kind === "sites")
    return (
      <svg {...common}>
        {/* a torso and thighs, with the places to inject shaded */}
        <path d="M84 14c-6 18-10 40-10 62 0 14 2 26 6 36M156 14c6 18 10 40 10 62 0 14-2 26-6 36" className={surfaceStyles.artLine} />
        <path d="M80 112c8 10 24 14 40 14s32-4 40-14M86 126l-6 30M154 126l6 30M106 128l-4 28M134 128l4 28" className={surfaceStyles.artLine} />
        <circle cx="120" cy="70" r="2.5" className={surfaceStyles.artInk} />
        <circle cx="120" cy="70" r="14" className={surfaceStyles.artDash} />
        <path d="M92 58h18M130 58h18M92 82h18M130 82h18" className={surfaceStyles.artZone} />
        <path d="M84 140h14M142 140h14" className={surfaceStyles.artZone} />
        <path d="M120 70h40" className={surfaceStyles.artDim} />
        <text x="166" y="74" className={surfaceStyles.artText}>
          5 cm
        </text>
      </svg>
    );
  if (kind === "needle" || kind === "dial" || kind === "start")
    return (
      <svg {...common}>
        {/* a pen, lying flat: cap end, window, dial */}
        <rect x="40" y="66" width="150" height="28" rx="14" className={surfaceStyles.artLine} />
        <rect x="96" y="73" width="34" height="14" rx="4" className={surfaceStyles.artLine} />
        <path d="M190 72h14v16h-14" className={surfaceStyles.artLine} />
        {kind === "needle" && <path d="M40 80H16M24 74v12" className={surfaceStyles.artInk} />}
        {kind === "needle" && <circle cx="10" cy="80" r="3" className={surfaceStyles.artDrop} />}
        {kind === "dial" && <path d="M204 66c10 4 10 24 0 28" className={surfaceStyles.artDim} />}
        {kind === "dial" && (
          <text x="102" y="84" className={surfaceStyles.artText}>
            dose
          </text>
        )}
        {kind === "start" && <path d="M52 112h120M52 120h80" className={surfaceStyles.artDash} />}
      </svg>
    );
  if (kind === "inject")
    return (
      <svg {...common}>
        {/* the pen straight down onto the skin, at a right angle */}
        <path d="M20 128c40-6 160-6 200 0" className={surfaceStyles.artLine} />
        <rect x="106" y="20" width="28" height="92" rx="14" className={surfaceStyles.artLine} />
        <path d="M120 112v20" className={surfaceStyles.artInk} />
        <path d="M120 10v10" className={surfaceStyles.artDim} />
        <path d="M150 124a30 30 0 0 0-30-30" className={surfaceStyles.artDash} />
        <text x="152" y="104" className={surfaceStyles.artText}>
          90°
        </text>
      </svg>
    );
  return (
    <svg {...common}>
      {/* a hard bottle with a screw lid for used needles */}
      <rect x="92" y="44" width="56" height="96" rx="12" className={surfaceStyles.artLine} />
      <rect x="102" y="28" width="36" height="16" rx="4" className={surfaceStyles.artLine} />
      <path d="M112 60l16 30M122 60l-10 40" className={surfaceStyles.artInk} />
    </svg>
  );
}
