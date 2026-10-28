"use client";

import { useRef, useState } from "react";
import { ArrowRight, CheckCircle, FileArrowUp, XCircle } from "@phosphor-icons/react";
import { errorMessage } from "@/lib/http/apiClient";
import type { NewReport } from "@/types/report";
import { toApiDate } from "@/lib/format/dateTime";
import formStyles from "./styles/FormControls.module.css";
import styles from "./LabReportUpload.module.css";

/**
 * Upload a lab report: the date on the report first, then the file. The care team reviews reports
 * from the last 90 days only (the team's rule; the backend checks it again), so the file can be
 * chosen once the date passes. Used on /pricing and /dashboard/reports; the page does the upload.
 */

const MAX_AGE_DAYS = 90;
const MAX_BYTES = 10 * 1024 * 1024;
const DAY_MS = 864e5;

/** Whole days from the report's date to today, both read as local dates. */
function daysSince(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const today = new Date();
  return Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(y, m - 1, d).getTime()) / DAY_MS);
}

function dateCheck(isoDate: string, tooOldAdvice: string) {
  const days = daysSince(isoDate);
  if (days < 0) return { valid: false, message: "Report date cannot be in the future." };
  if (days <= MAX_AGE_DAYS) return { valid: true, message: `Report verified (${days} days old). Valid for consultation (Within 3 months limit).` };
  return { valid: false, message: `Report is ${days} days old (>90 days). Doctor consultation requires a report under 3 months.${tooOldAdvice ? ` ${tooOldAdvice}` : ""}` };
}

const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

export default function LabReportUpload({
  dateLabel,
  chooseLabel,
  submitLabel,
  tooOldAdvice = "",
  onUpload,
}: {
  dateLabel: string;
  chooseLabel: string;
  submitLabel: string;
  tooOldAdvice?: string;
  onUpload: (report: NewReport) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [reportDate, setReportDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const check = reportDate ? dateCheck(reportDate, tooOldAdvice) : null;
  const ready = Boolean(check?.valid && file);

  const pick = (chosen: File | undefined) => {
    if (!chosen) return;
    setError(chosen.size > MAX_BYTES ? "This file is over 10 MB. Choose a smaller one." : null);
    setFile(chosen.size > MAX_BYTES ? null : chosen);
  };

  const submit = async () => {
    if (!ready || !file || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onUpload({ file, reportDate, title: file.name.replace(/\.[^.]+$/, "") });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.form}>
      <label className={formStyles.field}>
        <span className={formStyles.label}>{dateLabel}</span>
        <input
          type="date"
          className={formStyles.input}
          value={reportDate}
          max={toApiDate(new Date())}
          aria-invalid={check ? !check.valid : undefined}
          onChange={(e) => setReportDate(e.target.value)}
        />
      </label>
      {check && (
        <p className={check.valid ? styles.ok : formStyles.err} role={check.valid ? "status" : "alert"}>
          {check.valid ? <CheckCircle size={16} weight="bold" aria-hidden="true" /> : <XCircle size={16} weight="bold" aria-hidden="true" />}
          <span>{check.message}</span>
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept=".pdf,image/png,image/jpeg"
        hidden
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button type="button" className={styles.zone} disabled={!check?.valid} onClick={() => input.current?.click()}>
        <FileArrowUp size={28} aria-hidden="true" />
        <strong>{file ? file.name : chooseLabel}</strong>
        <span className="num">{file ? `${fileSize(file.size)}. Tap to change.` : check?.valid ? "Max size 10MB" : "Please provide a valid report date (<= 3 months) first"}</span>
      </button>

      {error && (
        <p className={formStyles.err} role="alert">
          <XCircle size={16} weight="bold" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <button type="button" className={`btn ${formStyles.go}`} disabled={!ready} onClick={submit} data-busy={busy} aria-busy={busy}>
        <span>{busy ? "Uploading" : submitLabel}</span>
        <span className="well" aria-hidden="true">
          {busy ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
        </span>
      </button>
    </div>
  );
}
