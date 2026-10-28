"use client";

/*
  The "Privacy and security" sheet (Arhaan AccountSheet.tsx PrivacySettings): the patient's consent,
  saved as it is flipped through PATCH /api/patient/privacy, and how signing in works.
*/

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { errorMessage } from "@/lib/http/apiClient";
import { updatePrivacyConsent } from "@/services/patientProfileService";
import type { PatientProfile } from "@/types/patientProfile";
import styles from "../ProfilePage.module.css";

export default function PrivacySettings({
  profile,
  onSaved,
}: {
  profile: PatientProfile;
  onSaved: (changes: Partial<PatientProfile>) => void;
}) {
  const toast = useToast();
  const [consentGiven, setConsentGiven] = useState(profile.consentGiven);

  const flip = async () => {
    const next = !consentGiven;
    setConsentGiven(next);
    try {
      await updatePrivacyConsent(next);
      onSaved({ consentGiven: next });
    } catch (error) {
      setConsentGiven(!next);
      toast(errorMessage(error));
    }
  };

  return (
    <div className={styles.acct}>
      <section className={styles.acctGroup} aria-labelledby="consent-heading">
        <h3 id="consent-heading" className={styles.subHead}>
          What you agreed to
        </h3>
        <ul className={styles.toggles}>
          <li>
            <label className={styles.toggleRow}>
              <span>
                <strong>
                  I consent to the applicable data-processing terms
                </strong>
              </span>
              <span className={styles.switch}>
                <input type="checkbox" checked={consentGiven} onChange={flip} />
                <i aria-hidden="true" />
              </span>
            </label>
          </li>
        </ul>
      </section>

      <section className={styles.acctGroup} aria-labelledby="signin-heading">
        <h3 id="signin-heading" className={styles.subHead}>
          Signing in
        </h3>
        <p className={styles.acctText}>
          A one-time code to your mobile. No password.
        </p>
      </section>
    </div>
  );
}
