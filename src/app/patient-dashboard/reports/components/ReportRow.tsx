"use client";

/**
 * One report in the list (Arhaan's report row: plate, title, date, caret), with the medical team's
 * review when the report decides eligibility (and the reason when it was not approved). An upload
 * opens its file; a Redcliffe report asks the backend for a fresh link to the lab's PDF first.
 */

import { useState } from "react";
import { CaretRight, FileText, Flask } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/ToastProvider";
import { longDate, shortDate } from "@/lib/format/dateTime";
import { errorMessage } from "@/lib/http/apiClient";
import { getLabReportUrl } from "@/services/labTestService";
import type { MedicalReport } from "@/types/report";
import styles from "../ReportsPage.module.css";

const REVIEW_WORDS: Record<
  NonNullable<MedicalReport["reviewStatus"]>,
  string
> = {
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  NOT_APPROVED: "Not approved",
};

export default function ReportRow({ report }: { report: MedicalReport }) {
  const toast = useToast();
  const [opening, setOpening] = useState(false);

  const content = (
    <>
      <span className={styles.plate} aria-hidden="true">
        {report.source === "LAB_BOOKING" ? (
          <Flask size={17} />
        ) : (
          <FileText size={17} />
        )}
      </span>
      <span className={styles.rowText}>
        <strong>{report.title}</strong>
        {/* the report's own date first; for uploads, also when it was uploaded */}
        <span>
          {report.source === "LAB_BOOKING"
            ? "From your home blood test"
            : "Dated"}
          {report.source === "LAB_BOOKING" ? ", " : " "}
          <span className="num">{longDate(report.reportDate)}</span>
          {report.source === "UPLOADED" && (
            <>
              {" · uploaded "}
              <span className="num">{shortDate(report.addedAt)}</span>
            </>
          )}
        </span>
        {report.reviewStatus && (
          <span className={styles.review} data-review={report.reviewStatus}>
            {REVIEW_WORDS[report.reviewStatus]}
            {report.reviewStatus === "NOT_APPROVED" && report.reviewNote && (
              <span className={styles.reviewNote}>. {report.reviewNote}</span>
            )}
          </span>
        )}
      </span>
      {opening ? (
        <i className={styles.spin} aria-label="Opening" />
      ) : (
        <CaretRight size={17} className={styles.go} aria-hidden="true" />
      )}
    </>
  );

  if (report.fileUrl) {
    return (
      <a
        href={report.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.row}
      >
        {content}
      </a>
    );
  }

  const openLabReport = async () => {
    if (!report.labBookingId || opening) return;
    // open the tab inside the tap, so the browser does not block it, then point it at the fresh link
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const url = await getLabReportUrl(report.labBookingId);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (caught) {
      tab?.close();
      toast(errorMessage(caught));
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.row}
      onClick={openLabReport}
      disabled={!report.labBookingId}
    >
      {content}
    </button>
  );
}
