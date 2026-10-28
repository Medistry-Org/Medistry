"use client";

/*
  The "Privacy and security" sheet (Arhaan AccountSheet.tsx PrivacySettings): the patient's consent,
  saved as it is flipped through PATCH /api/patient/privacy, and how signing in works.
*/

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { errorMessage } from "@/lib/http/apiClient";
import { updatePrivacyConsent } from "@/services/patientProfileService";
import type { PatientProfile } from "@/types/patient";
import surfaceStyles from "@/components/ui/styles/Surfaces.module.css";

export default function PrivacySettings({ profile, onSaved }: { profile: PatientProfile; onSaved: (changes: Partial<PatientProfile>) => void }) {
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
    <div className={surfaceStyles.acct}>
      <section className={surfaceStyles.acctGroup} aria-labelledby="consent-heading">
        <h3 id="consent-heading" className={surfaceStyles.subHead}>
          What you agreed to
        </h3>
        <ul className={surfaceStyles.toggles}>
          <li>
            <label className={surfaceStyles.toggleRow}>
              <span>
                <strong>I consent to the applicable data-processing terms</strong>
              </span>
              <span className={surfaceStyles.switch}>
                <input type="checkbox" checked={consentGiven} onChange={flip} />
                <i aria-hidden="true" />
              </span>
            </label>
          </li>
        </ul>
      </section>

      <section className={surfaceStyles.acctGroup} aria-labelledby="signin-heading">
        <h3 id="signin-heading" className={surfaceStyles.subHead}>
          Signing in
        </h3>
        <p className={surfaceStyles.acctText}>A one-time code to your mobile. No password.</p>
      </section>
    </div>
  );
}
