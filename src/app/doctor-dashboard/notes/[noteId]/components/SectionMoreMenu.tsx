"use client";

/** Restore and Copy for a section: a small menu. Esc closes it and focus goes back to the button. */

import { useEffect, useRef, useState } from "react";
import { DotsThree } from "@phosphor-icons/react";
import type { NoteSectionKey } from "@/types/clinicalNote";
import { restoreSection } from "@/app/doctor-dashboard/notes/components/noteEdits";
import { TITLES } from "@/app/doctor-dashboard/notes/components/noteState";
import { useNoteReview } from "./NoteReviewContext";
import styles from "./NoteSections.module.css";

export default function SectionMoreMenu({
  sectionKey,
  canRestore,
  text,
}: {
  sectionKey: NoteSectionKey;
  canRestore: boolean;
  text: string;
}) {
  const review = useNoteReview();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>("button:not([disabled])")
      ?.focus();
    const away = (event: PointerEvent) => {
      if (
        !menu.current?.contains(event.target as Node) &&
        !button.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <span className={styles.moreWrap}>
      <button
        ref={button}
        type="button"
        className={styles.iconBtn}
        aria-label={`More for the ${TITLES[sectionKey]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <DotsThree size={20} weight="bold" />
      </button>
      {open && (
        <div
          ref={menu}
          className={styles.menu}
          role="menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const items = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button:not([disabled])",
                ),
              );
              const i = items.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              items[
                (i + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
                  items.length
              ]?.focus();
            }
          }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canRestore}
            onClick={() => {
              review.apply(restoreSection(review.note, sectionKey));
              close();
              review.toast(`The scribe's ${TITLES[sectionKey]} is back`);
            }}
          >
            Restore the scribe&apos;s draft
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              close();
              try {
                await navigator.clipboard.writeText(text);
                review.toast(`${TITLES[sectionKey]} copied`);
              } catch {
                review.toast("Copying is not available here");
              }
            }}
          >
            Copy
          </button>
        </div>
      )}
    </span>
  );
}
