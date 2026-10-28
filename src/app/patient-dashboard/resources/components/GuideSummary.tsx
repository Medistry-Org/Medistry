/* A guide in brief (Arhaan Guides.tsx Summary): its three short lines, read before the sections. */

import type { Guide } from "../content/guideContent";
import styles from "./GuideSummary.module.css";

export default function GuideSummary({ guide }: { guide: Guide }) {
  if (!guide.short.length) return null;
  return (
    <ul className={styles.short}>
      {guide.short.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
