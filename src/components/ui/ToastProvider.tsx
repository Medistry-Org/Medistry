"use client";

/**
 * A short confirmation at the foot of the screen for anything just saved, optionally with Undo.
 * The patient and doctor shells wrap their dashboard in ToastProvider; any page calls useToast().
 * `className` lets the shell lift the toast above its bottom dock.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import styles from "./ToastProvider.module.css";

type ShowToast = (message: string, undo?: () => void) => void;
type Toast = { message: string; undo?: () => void; key: number };

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

/** Long enough to read: a longer line stays longer, and one with Undo stays long enough to tap it. */
const visibleMs = (toast: Toast) =>
  Math.max(toast.undo ? 4500 : 2600, toast.message.length * 55);

export default function ToastProvider({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const showToast = useCallback<ShowToast>(
    (message, undo) => setToast({ message, undo, key: Math.random() }),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), visibleMs(toast));
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`${styles.toast} ${className}`}
        data-show={!!toast}
        data-undo={!!toast?.undo}
        role="status"
        aria-live="polite"
      >
        <span>{toast?.message}</span>
        {toast?.undo && (
          <button
            type="button"
            className={styles.undo}
            onClick={() => {
              toast.undo?.();
              setToast(null);
            }}
          >
            Undo
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
