/*
  The "Plan and payments" sheet (Arhaan Profile.tsx Plan): the plan from the patient's profile, or,
  before one, what happens after the first consultation. Plans are chosen and paid on /patient-dashboard/plans.
*/

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import type { PatientProfile } from "@/types/patientProfile";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../ProfilePage.module.css";

export default function PlanSummary({
  profile,
  active,
}: {
  profile: PatientProfile;
  active: boolean;
}) {
  if (!active) {
    return (
      <div className={styles.acct}>
        <div className={styles.planNone}>
          <strong>{profile.planName || "No programme yet"}</strong>
          <p>
            After your first consultation, your doctor may suggest a programme.
            You see the itemised price before you pay anything.
          </p>
          <p className={formStyles.hint}>
            Medicine, only if your doctor prescribes it. Not everyone is
            prescribed medication.
          </p>
          <Link href="/patient-dashboard/plans" className={formStyles.link}>
            See the plans <CaretRight size={15} />
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.acct}>
      <dl className={styles.dl}>
        <div>
          <dt>Programme</dt>
          <dd>{profile.planName || "Your programme"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{profile.planStatus}</dd>
        </div>
      </dl>
    </div>
  );
}
