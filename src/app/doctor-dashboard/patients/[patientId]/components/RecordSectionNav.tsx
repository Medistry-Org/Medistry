"use client";

/*
  The record's section chips (Arhaan's record nav), sticky under the page top. Scroll-spy: the chip
  of the section under the bar lights up and is kept in view inside its own row (never with
  scrollIntoView, which would move the page too). A chip just tapped wins over its neighbour when
  two cards share a row.
*/

import { useEffect, useRef, useState } from "react";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./RecordSectionNav.module.css";

export type RecordChip = {
  id: string;
  label: string;
  dot?: { label: string; urgent?: boolean };
};

export default function RecordSectionNav({ chips }: { chips: RecordChip[] }) {
  const [active, setActive] = useState(chips[0]?.id ?? "");
  const picked = useRef<string | null>(null);
  const bar = useRef<HTMLElement>(null);
  const ids = chips.map((chip) => chip.id).join(",");

  useEffect(() => {
    const sections = ids.split(",");
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // the line just under the sticky chips: a section counts once its top passes it
        const line = (bar.current?.getBoundingClientRect().bottom ?? 120) + 120;
        let current = sections[0];
        let last = -Infinity;
        for (const id of sections) {
          const top = document.getElementById(id)?.getBoundingClientRect().top;
          // two cards side by side share a top: the left one, first in the page, keeps the chip
          if (top !== undefined && top <= line && top > last + 1) {
            current = id;
            last = top;
          }
        }
        const tapped = picked.current
          ? document.getElementById(picked.current)?.getBoundingClientRect().top
          : undefined;
        if (
          picked.current &&
          tapped !== undefined &&
          Math.abs(tapped - last) <= 1
        )
          current = picked.current;
        // at the very bottom, the last section is the one being read
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4
        )
          current = sections[sections.length - 1];
        setActive(current);
        const chip = bar.current?.querySelector<HTMLElement>(
          `[data-chip="${current}"]`,
        );
        const row = bar.current;
        if (
          chip &&
          row &&
          (chip.offsetLeft < row.scrollLeft ||
            chip.offsetLeft + chip.offsetWidth >
              row.scrollLeft + row.clientWidth)
        )
          row.scrollTo({ left: chip.offsetLeft - 16, behavior: "smooth" });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ids]);

  return (
    <nav ref={bar} className={styles.recNav} aria-label="Record">
      {chips.map((chip) => (
        <a
          key={chip.id}
          href={`#${chip.id}`}
          className={styles.recChip}
          data-chip={chip.id}
          aria-current={active === chip.id ? "location" : undefined}
          onClick={() => {
            picked.current = chip.id;
            setActive(chip.id);
          }}
        >
          {chip.label}
          {chip.dot && (
            <i
              className={clinicStyles.dotWait}
              data-urgent={chip.dot.urgent || undefined}
              aria-label={chip.dot.label}
            />
          )}
        </a>
      ))}
    </nav>
  );
}
