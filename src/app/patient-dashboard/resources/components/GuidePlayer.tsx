"use client";

/*
  The video at the top of a guide (Arhaan Guides.tsx Player). There is no footage yet, so play says
  so calmly and points to the written version below, which covers the same ground. Never a broken
  player.
*/

import { useState } from "react";
import { Play } from "@phosphor-icons/react";
import ContourField from "@/components/ui/ContourField";
import { PRESENTERS, type Guide } from "../content/guideContent";
import pageStyles from "../ResourcesPage.module.css";
import styles from "./GuidePlayer.module.css";

export default function GuidePlayer({
  guide,
}: {
  guide: Guide & { video: NonNullable<Guide["video"]> };
}) {
  const [asked, setAsked] = useState(false);
  const presenter = PRESENTERS[guide.video.by];
  const hasSteps = guide.slug === "first-injection";
  return (
    <div className={pageStyles.player}>
      <ContourField
        className={pageStyles.field}
        density={9}
        lineAlpha={0.12}
        signalAlpha={0.4}
        seed={guide.slug.length % 9}
        interactive={false}
        scan={!asked}
      />
      {asked ? (
        <div className={styles.waiting} role="status">
          <strong>Video in production</strong>
          <p>
            {hasSteps
              ? "The steps below cover the same"
              : "The guide below covers the same"}
            , in writing, from {presenter.name}.
          </p>
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("guide-text")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {hasSteps ? "Read the steps" : "Read the guide"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.poster}
          onClick={() => setAsked(true)}
          aria-label={`Play video: ${guide.title}, ${guide.video.length}, with ${presenter.name}`}
        >
          <span className={styles.posterPlay} aria-hidden="true">
            <Play size={24} weight="fill" />
          </span>
          <span className={`${styles.posterFoot} ${styles.posterCap}`}>
            <span>{presenter.name}</span>
            <span className="num">{guide.video.length}</span>
          </span>
        </button>
      )}
    </div>
  );
}
