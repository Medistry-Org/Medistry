/*
  The counsellor's screening call, as the doctor needs it before the first consultation (Arhaan's
  ScreeningCard): short and scannable, with what to check before prescribing called out.
*/

import { Phone } from "@phosphor-icons/react";
import { clockTime, shortDate } from "@/lib/format/dateTime";
import type { Screening } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./ScreeningCard.module.css";

export default function ScreeningCard({ screening }: { screening: Screening }) {
  const cautions = screening.check.length > 0;
  return (
    <div className={styles.screen}>
      <div className={styles.screenHead}>
        <span className={styles.screenIcon} aria-hidden="true">
          <Phone size={16} />
        </span>
        <p>
          <strong>Counsellor&apos;s screening</strong>
          <span>
            {screening.by}
            {screening.byRole ? `, ${screening.byRole.toLowerCase()}` : ""} · phone, <span className="num">{screening.minutes}</span> min ·{" "}
            <span className="num">
              {shortDate(screening.at)}, {clockTime(new Date(screening.at))}
            </span>
          </span>
        </p>
        <span className={clinicStyles.pill} data-tone={cautions ? "draft" : "ok"}>
          {cautions ? "Fit to proceed, with cautions" : "Fit to proceed"}
        </span>
      </div>
      <dl className={styles.screenList}>
        <div>
          <dt>Goal</dt>
          <dd>{screening.goal}</dd>
        </div>
        <div>
          <dt>Tried before</dt>
          <dd>{screening.tried}</dd>
        </div>
        <div>
          <dt>Conditions and medicines mentioned</dt>
          <dd>{screening.mentioned}</dd>
        </div>
        <div data-warn={cautions || undefined}>
          <dt>To check before prescribing</dt>
          <dd>{cautions ? screening.check.join(". ") : "Nothing raised. Pregnancy plans, pancreatitis and gallbladder history were asked about."}</dd>
        </div>
      </dl>
      <p className={styles.screenFoot}>What the patient told the counsellor, not yet confirmed by a doctor.</p>
    </div>
  );
}
