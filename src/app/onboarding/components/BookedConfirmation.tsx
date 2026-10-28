/** The first consultation is booked: when, what happens before it, and the way into the account. */

import type { CSSProperties, RefObject } from "react";
import Link from "next/link";
import { ArrowRight, CalendarPlus } from "@phosphor-icons/react";
import { spokenDay } from "@/components/ui/SlotPicker";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { clockTime } from "@/lib/format/dateTime";
import { downloadConsultationInvite } from "../consultationCalendar";
import styles from "../OnboardingPage.module.css";

export default function BookedConfirmation({ startsAt, headingRef }: { startsAt: string; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const start = new Date(startsAt);
  return (
    <div className={styles.stage}>
      <div className={`${styles.step} ${styles.done}`} style={{ "--dir": 1 } as CSSProperties}>
        <span className={styles.seal} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className={styles.head}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.q}>
            Booked for {spokenDay(start)}
            <span className={styles.soft}> at {clockTime(start)}</span>
          </h1>
          <p className={styles.why}>Your consultation with a doctor takes 30 minutes, by video. We&apos;ll remind you on WhatsApp.</p>
        </div>
        <ul className={styles.facts}>
          <li>A counsellor calls you before it to check the programme suits you and to pass your details to your doctor.</li>
          <li>If you have no blood tests from the last 90 days, we book a home test before your consultation.</li>
          <li>Join from your account, where you can also change the time. The call opens 10 minutes before.</li>
        </ul>
        <div className={styles.doneActions}>
          <Link href="/dashboard" className={`btn ${formStyles.go}`}>
            <span>Go to my account</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>
          <button type="button" className={`btn btn--ghost ${styles.cal}`} onClick={() => downloadConsultationInvite(startsAt)}>
            <CalendarPlus size={18} />
            <span>Add to calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
