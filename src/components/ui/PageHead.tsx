"use client";

/**
 * The head of every dashboard page: one title size and position across the app, an optional back
 * link above the title, an optional line under it and an optional action on the right.
 * `back` is the page's parent; Back returns to the page the person actually came from when that is
 * a known dashboard page (lib/navigation/backDestination). `className` replaces the head's own
 * class, for an area with its own head spacing and title size (the doctor dashboard's `pageHead`).
 */

import { useState, type ReactNode } from "react";
import {
  readBackDestination,
  type BackDestination,
} from "@/lib/navigation/backDestination";
import BackLink from "./BackLink";
import styles from "./PageHead.module.css";

export default function PageHead({
  title,
  back,
  sub,
  action,
  className = styles.head,
}: {
  title: ReactNode;
  back?: BackDestination;
  sub?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  // read once, so the link never changes under a tap
  const [cameFrom] = useState(readBackDestination);
  const destination = back ? (cameFrom ?? back) : null;
  return (
    <div className={className}>
      {destination && (
        <BackLink href={destination.href} label={destination.label} />
      )}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {action}
      </div>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
