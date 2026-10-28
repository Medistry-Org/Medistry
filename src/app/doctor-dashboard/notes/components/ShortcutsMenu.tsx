"use client";

import { useEffect, useRef } from "react";
import { Keyboard } from "@phosphor-icons/react";
import styles from "./NoteBody.module.css";

const SHORTCUTS: [string[], string][] = [
  [["J", "K"], "Next or previous section"],
  [["E"], "Edit the section"],
  [["A"], "Mark the section checked"],
  [["F"], "Next thing to check"],
  [["T"], "Transcript"],
  [["[", "]"], "Previous or next note"],
  [["Esc"], "Finish editing, or let go"],
  [["⌘", "⇧", "Enter"], "Sign, when ready"],
  [["?"], "These shortcuts"],
];

/** The keyboard shortcuts for reviewing notes, shown on devices with a mouse. */
export default function ShortcutsMenu({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, setOpen]);
  return (
    <span ref={ref} className={styles.moreWrap}>
      <button type="button" className={styles.iconBtn} aria-label="Keyboard shortcuts" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Keyboard size={19} />
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.keys}`} role="dialog" aria-label="Keyboard shortcuts">
          <dl>
            {SHORTCUTS.map(([keys, what]) => (
              <div key={what}>
                <dt>
                  {keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </span>
  );
}
