"use client";

/*
  Prescriptions (Arhaan's record panel): a draft (never visible to the patient) with Review and
  sign, the signed version, and earlier versions folded away. Signing asks once more in place,
  naming the doctor, because the patient and the pharmacy see it once signed.
*/

import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/ToastProvider";
import { shortDate } from "@/lib/format/dateTime";
import { errorMessage } from "@/lib/http/apiClient";
import { signPrescription } from "@/services/patientRecordService";
import type { Prescription } from "@/types/patientRecord";
import clinicStyles from "@/app/doctor-dashboard/styles/ClinicSurfaces.module.css";
import styles from "./PrescriptionsPanel.module.css";

const lcFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

function Items({ prescription }: { prescription: Prescription }) {
  return (
    <>
      <ul className={styles.rxItems}>
        {prescription.items.map((item) => (
          <li key={item.name}>
            <strong>
              {item.name} {item.strength}
            </strong>
            <span>
              {item.dose}, {lcFirst(item.frequency)}, for {item.duration}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.rxAdvice}>{prescription.advice}</p>
    </>
  );
}

export default function PrescriptionsPanel({ patientId, prescriptions, doctorName, onChanged }: { patientId: string; prescriptions: Prescription[]; doctorName: string; onChanged: () => void }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [signing, setSigning] = useState(false);
  const draft = prescriptions.find((rx) => rx.status === "DRAFT");
  const signed = prescriptions.find((rx) => rx.status === "SIGNED");
  const history = prescriptions.filter((rx) => rx.status === "SUPERSEDED");

  const sign = async (rx: Prescription) => {
    setSigning(true);
    try {
      await signPrescription(patientId, rx.id);
      setConfirming(false);
      toast(`Version ${rx.version} signed`);
      onChanged();
    } catch (caught) {
      toast(errorMessage(caught));
    } finally {
      setSigning(false);
    }
  };

  return (
    <section id="prescriptions" className={clinicStyles.panel} aria-labelledby="prescriptions-heading">
      <div className={clinicStyles.panelHead}>
        <h2 id="prescriptions-heading" className={clinicStyles.h2}>
          Prescriptions
        </h2>
      </div>
      {draft && (
        <div className={styles.rx} data-draft="true">
          <div className={styles.rxHead}>
            <strong>Version {draft.version}</strong>
            <span className={clinicStyles.pill} data-tone="warn">
              Draft, not visible to the patient
            </span>
          </div>
          <Items prescription={draft} />
          {confirming ? (
            <div className={clinicStyles.confirm}>
              <p>
                Sign version {draft.version} as {doctorName}? The patient and the pharmacy see it once signed.
              </p>
              <div>
                <button type="button" className="btn" disabled={signing} onClick={() => sign(draft)}>
                  <span>Sign</span>
                  <span className="well" aria-hidden="true">
                    <CheckCircle size={18} />
                  </span>
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
                  Not yet
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn" onClick={() => setConfirming(true)}>
              <span>Review and sign</span>
              <span className="well" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </button>
          )}
        </div>
      )}
      {signed ? (
        <div className={styles.rx}>
          <div className={styles.rxHead}>
            <strong>Version {signed.version}</strong>
            <span className={clinicStyles.pill} data-tone="ok">
              Signed {shortDate(signed.date)}
            </span>
          </div>
          <Items prescription={signed} />
        </div>
      ) : (
        !draft && <p className={clinicStyles.empty}>No prescription. Medicine only if you judge it clinically appropriate.</p>
      )}
      {history.length > 0 && (
        <details className={clinicStyles.history}>
          <summary>Earlier versions</summary>
          {history.map((rx) => (
            <p key={rx.id}>
              Version {rx.version}, {shortDate(rx.date)}: {rx.items.map((item) => `${item.name} ${item.strength}`).join(", ")}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
