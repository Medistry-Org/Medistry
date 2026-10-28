"use client";

/*
  Where to turn, at the end of a guide (Arhaan Guides.tsx HelpLevels): what needs a hospital now,
  and what needs a message to the care team today. The hospital list is folded on a phone, so the
  page stays short (its red heading says what to do), and opens by itself on a laptop.
*/

import { useEffect, useRef } from "react";
import { CaretDown, Phone, WarningCircle } from "@phosphor-icons/react";
import type { Guide } from "../content/guideContent";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";
import styles from "./Resources.module.css";

export default function GuideHelpLevels({ help }: { help: NonNullable<Guide["help"]> }) {
  const urgent = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (urgent.current && window.matchMedia("(min-width: 1024px)").matches) urgent.current.open = true;
  }, []);

  return (
    <div className={surfaceStyles.levels}>
      {help.urgent && (
        <details ref={urgent} className={`${surfaceStyles.level} ${styles.urgent}`} data-level="urgent">
          <summary>
            <h3>
              <WarningCircle size={18} weight="fill" /> Go to hospital or call 112 if
            </h3>
            <CaretDown size={16} className={surfaceStyles.caret} aria-hidden="true" />
          </summary>
          <ul className={surfaceStyles.dots}>
            {help.urgent.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      {help.today && (
        <details className={surfaceStyles.section}>
          <summary>
            <span className={styles.todaySum}>
              <Phone size={18} /> Message your care team today if
            </span>
            <CaretDown size={16} className={surfaceStyles.caret} aria-hidden="true" />
          </summary>
          <div className={surfaceStyles.sectionBody}>
            <ul className={surfaceStyles.dots}>
              {help.today.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}
