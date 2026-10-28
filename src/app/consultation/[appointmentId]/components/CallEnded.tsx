/** After the doctor ends the consultation: a calm close and the way back. */

import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import styles from "./ConsultationRoom.module.css";

export default function CallEnded({ home }: { home: string }) {
  return (
    <section className={styles.ended} aria-live="polite">
      <div className={styles.endedIcon}>
        <Check size={30} weight="light" />
      </div>
      <span className={styles.endedLabel}>Consultation complete</span>
      <h1>The call has ended.</h1>
      <Link href={home} className={styles.secondaryButton}>
        Back to Today
      </Link>
    </section>
  );
}
