"use client";

/**
 * One report in the list (Arhaan's report row: plate, title, date, caret). An upload opens its file;
 * a Redcliffe report asks the backend for a fresh link to the lab's PDF first.
 */

import { useState } from "react";
import { CaretRight, FileText, Flask } from "@phosphor-icons/react";
import { getLabReportUrl } from "@/services/labTestService";
import { errorMessage } from "@/lib/http/apiClient";
import { longDate } from "@/lib/format/dateTime";
import type { MedicalReport } from "@/types/report";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "../Reports.module.css";

export default function ReportRow({ report }: { report: MedicalReport }) {
  const toast = useToast();
  const [opening, setOpening] = useState(false);

  const content = (
    <>
      <span className={styles.plate} aria-hidden="true">
        {report.source === "LAB_BOOKING" ? <Flask size={17} /> : <FileText size={17} />}
      </span>
      <span className={styles.rowText}>
        <strong>{report.title}</strong>
        <span>
          {report.source === "LAB_BOOKING" ? "From your home blood test" : "Uploaded"}, <span className="num">{longDate(report.reportDate)}</span>
        </span>
      </span>
      {opening ? <i className={styles.spin} aria-label="Opening" /> : <CaretRight size={17} className={styles.go} aria-hidden="true" />}
    </>
  );

  if (report.fileUrl) {
    return (
      <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.row}>
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
    <button type="button" className={styles.row} onClick={openLabReport} disabled={!report.labBookingId}>
      {content}
    </button>
  );
}
