"use client";

/**
 * Step 3: who is being tested. Starts from the patient's profile; Redcliffe needs every field and
 * accepts only male or female. The package's own limits (age range, one sex only) are checked here,
 * before a time is chosen, so the booking does not fail at the end.
 */

import { useState, type FormEvent } from "react";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import type { LabPackage, LabPatient, LabPatientGender } from "@/types/labTest";
import SegmentedControl from "@/components/ui/SegmentedControl";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { LabPatientDraft } from "../useLabBookingFlow";
import styles from "./LabBookingSteps.module.css";

/** The first thing wrong with the form, in words, or null when Redcliffe will accept it. */
function problemWith(draft: LabPatientDraft, labPackage: LabPackage) {
  if (!/^[A-Za-z .]{3,30}$/.test(draft.name.trim())) return "Enter the full name in letters, 3 to 30 characters.";
  if (!Number.isInteger(draft.age) || draft.age < 1 || draft.age > 120) return "Enter the age in years.";
  if (labPackage.ageRange && (draft.age < labPackage.ageRange.min || draft.age > labPackage.ageRange.max)) {
    return `${labPackage.name} is for ages ${labPackage.ageRange.min} to ${labPackage.ageRange.max}. Choose another test.`;
  }
  if (!draft.gender) return "Choose male or female.";
  if (labPackage.forGender !== "Both" && labPackage.forGender !== draft.gender) {
    return `${labPackage.name} is for ${labPackage.forGender === "Female" ? "women" : "men"} only. Choose another test.`;
  }
  if (!/^[6-9]\d{9}$/.test(draft.mobile)) return "Enter a 10-digit Indian mobile number.";
  if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) return "Enter an email address for the lab's confirmation.";
  return null;
}

export default function PatientStep({ initial, labPackage, onSave }: { initial: LabPatientDraft; labPackage: LabPackage; onSave: (patient: LabPatient) => void }) {
  const [draft, setDraft] = useState(initial);
  const [tried, setTried] = useState(false);
  const problem = problemWith(draft, labPackage);
  const set = (changes: Partial<LabPatientDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (problem || !draft.gender) return;
    onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim(), gender: draft.gender });
  };

  return (
    <form className={styles.fields} onSubmit={submit} noValidate>
      <p className={styles.sheetMeta}>The lab needs these details for the sample and the report.</p>
      <label className={formStyles.field}>
        <span className={formStyles.label}>Full name</span>
        <input className={formStyles.input} value={draft.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" />
      </label>
      <div className={styles.pairFields}>
        <label className={formStyles.field}>
          <span className={formStyles.label}>Age</span>
          <input
            className={`${formStyles.input} num`}
            inputMode="numeric"
            value={draft.age || ""}
            maxLength={3}
            onChange={(e) => set({ age: Number(e.target.value.replace(/\D/g, "")) })}
          />
        </label>
        <div className={formStyles.field}>
          <span className={formStyles.label}>Gender</span>
          <SegmentedControl<LabPatientGender>
            label="Gender"
            value={draft.gender ?? ("" as LabPatientGender)}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
            ]}
            onChange={(gender) => set({ gender })}
          />
        </div>
      </div>
      <label className={formStyles.field}>
        <span className={formStyles.label}>Mobile number</span>
        <input
          className={`${formStyles.input} num`}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={draft.mobile}
          onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, "") })}
          autoComplete="tel-national"
        />
        <span className={formStyles.hint}>The collector calls this number.</span>
      </label>
      <label className={formStyles.field}>
        <span className={formStyles.label}>Email</span>
        <input className={formStyles.input} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" />
      </label>
      {tried && problem && (
        <p className={formStyles.err} role="alert">
          <WarningCircle size={16} weight="bold" aria-hidden="true" />
          <span>{problem}</span>
        </p>
      )}
      <button type="submit" className={`btn ${formStyles.go}`}>
        <span>Continue</span>
        <span className="well" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </button>
    </form>
  );
}
