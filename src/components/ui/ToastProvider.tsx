"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import layoutStyles from "./styles/AppLayout.module.css";

type ShowToast = (message: string, undo?: () => void) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** A short confirmation at the foot of the screen for anything just saved, optionally with Undo. */
export const useToast = () => useContext(ToastContext);

/**
 * Wraps a dashboard (the patient and doctor shells use it). `className` lets the shell lift the
 * toast above its bottom dock.
 */
export default function ToastProvider({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [note, setNote] = useState<{ message: string; undo?: () => void; key: number } | null>(null);
  const showToast = useCallback<ShowToast>((message, undo) => setNote({ message, undo, key: Math.random() }), []);

  useEffect(() => {
    if (!note) return;
    // long enough to read: a longer line stays longer
    const timer = setTimeout(() => setNote(null), Math.max(note.undo ? 4500 : 2600, note.message.length * 55));
    return () => clearTimeout(timer);
  }, [note]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`${layoutStyles.toast} ${className}`} data-show={!!note} data-undo={!!note?.undo} role="status" aria-live="polite">
        <span>{note?.message}</span>
        {note?.undo && (
          <button
            type="button"
            className={layoutStyles.toastUndo}
            onClick={() => {
              note.undo?.();
              setNote(null);
            }}
          >
            Undo
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
