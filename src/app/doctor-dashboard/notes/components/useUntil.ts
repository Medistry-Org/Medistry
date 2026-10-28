"use client";

/** The current time, each second, until `ms` has passed; then it stops ticking. Drafts being written count down with it. */

import { useEffect, useState } from "react";

export function useUntil(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  const done = now >= ms;
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [done]);
  return now;
}
