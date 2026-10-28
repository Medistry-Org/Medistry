"use client";

import { useState, type ReactNode } from "react";
import { readBackDestination, type BackDestination } from "@/lib/navigation/backDestination";
import BackLink from "./BackLink";
import furnitureStyles from "./styles/PageFurniture.module.css";

/**
 * The head of every dashboard page: one title size and position across the app, an optional back
 * link above the title, an optional line under it and an optional action on the right.
 * `back` is the page's parent; Back returns to the page the person actually came from when that is
 * a known dashboard page.
 */
export default function PageHead({ title, back, sub, action }: { title: ReactNode; back?: BackDestination; sub?: ReactNode; action?: ReactNode }) {
  // read once, so the link never changes under a tap
  const [cameFrom] = useState(readBackDestination);
  const destination = back ? (cameFrom ?? back) : null;
  return (
    <div className={furnitureStyles.head}>
      {destination && <BackLink href={destination.href} label={destination.label} />}
      <div className={furnitureStyles.titleRow}>
        <h1 className={furnitureStyles.title}>{title}</h1>
        {action}
      </div>
      {sub && <p className={furnitureStyles.sub}>{sub}</p>}
    </div>
  );
}
