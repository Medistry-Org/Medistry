"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import a from "./Account.module.css";
import s from "./Sheet.module.css";

/**
 * A sheet from the bottom on a phone, a centred panel on a laptop. On a phone it follows the finger
 * from the handle and closes on a flick or a long pull, whichever comes first. Escape and the scrim
 * close it too, and focus returns to whatever opened it.
 */
export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const drag = useRef<{ y: number; t: number; dy: number; v: number } | null>(null);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  // mount, then show on the next frame so the entry transition plays; hide, then unmount after it
  if (open && !mounted) setMounted(true);
  if (!open && shown) setShown(false);

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    const t = setTimeout(() => setMounted(false), 380);
    (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    // confirmations wait while a sheet is open, so they never cover what is in it
    html.dataset.sheet = "open";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select, summary, [tabindex='0']"));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      delete html.dataset.sheet;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, onClose]);

  useEffect(() => {
    if (shown) panel.current?.focus({ preventScroll: true });
  }, [shown]);

  if (!mounted) return null;

  const onDown = (e: React.PointerEvent) => {
    if (window.matchMedia("(min-width: 768px)").matches || (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, t: performance.now(), dy: 0, v: 0 };
    panel.current!.style.transition = "none";
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    const raw = e.clientY - d.y;
    // pulled upwards it resists, the further the harder; downwards it follows the finger exactly
    const dy = raw < 0 ? -((-raw * 0.55 * 80) / (80 + 0.55 * -raw)) : raw;
    d.v = (dy - d.dy) / Math.max(1, now - d.t);
    d.dy = dy;
    d.t = now;
    panel.current!.style.transform = `translate3d(0, ${dy}px, 0)`;
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !panel.current) return;
    panel.current.style.transition = "";
    panel.current.style.transform = "";
    // a quick flick closes it even when short; a slow pull closes it past a third of its height
    if (d.v > 0.5 || d.dy > panel.current.offsetHeight / 3) onClose();
  };

  return (
    <div className={s.root} data-shown={shown}>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={panel} className={s.panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className={s.grab} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className={s.handle} aria-hidden="true" />
          <div className={s.head}>
            <h2 className={s.title}>{title}</h2>
            <button type="button" className={a.round} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );
}
