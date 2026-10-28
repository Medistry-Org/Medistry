/** After the doctor ends the consultation: a calm close and the way back to the person's home. */

import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import styles from "./ConsultationRoom.module.css";

export default function CallEnded({
  home,
  homeLabel,
}: {
  home: string;
  homeLabel: string;
}) {
  return (
    <section className={styles.ended} aria-live="polite">
      <div className={styles.endedIcon}>
        <Check size={30} weight="light" />
      </div>
      <span className={styles.endedLabel}>Consultation complete</span>
      <h1>The call has ended.</h1>
      <Link href={home} className={styles.secondaryButton}>
        Back to {homeLabel}
      </Link>
    </section>
  );
}
