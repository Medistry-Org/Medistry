/*
  A guide's written version (Arhaan Guides.tsx Article): the summary, then each section closed so
  the help levels stay in view, then the way to the care team. A guide with no video shows its
  summary beside the text instead, so `summary` leaves it out here.
*/

import Link from "next/link";
import { CaretDown, ChatCircleText } from "@phosphor-icons/react";
import type { Guide } from "../content/guideContent";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";
import GuideHelpLevels from "./GuideHelpLevels";
import GuideSummary from "./GuideSummary";

export default function GuideArticle({ guide, summary }: { guide: Guide; summary: boolean }) {
  return (
    <div className={surfaceStyles.article}>
      {summary && <GuideSummary guide={guide} />}
      {guide.sections.map((section) => (
        <details key={section.h} className={surfaceStyles.section}>
          <summary>
            {section.h}
            <CaretDown size={16} className={surfaceStyles.caret} aria-hidden="true" />
          </summary>
          <div className={surfaceStyles.sectionBody}>
            {section.p?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list && (
              <ul className={surfaceStyles.dots}>
                {section.list.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
      {guide.help && <GuideHelpLevels help={guide.help} />}
      <Link href="/dashboard/messages" className={`btn btn--ghost ${surfaceStyles.wide}`}>
        <ChatCircleText size={18} />
        <span>Message your care team</span>
      </Link>
    </div>
  );
}
