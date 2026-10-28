"use client";

/**
 * Reports: upload a recent lab report (the date on it must be within the last 90 days, the team's
 * rule) and see every report in the record: uploads and the ones Redcliffe Labs sent for a home test.
 */

import { useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import { listMyReports, uploadReport } from "@/services/reportService";
import type { NewReport } from "@/types/report";
import Card from "@/components/ui/Card";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LabReportUpload from "@/components/ui/LabReportUpload";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageHead from "@/components/ui/PageHead";
import { useToast } from "@/components/ui/ToastProvider";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import ReportRow from "./components/ReportRow";
import styles from "./Reports.module.css";

export default function ReportsPage() {
  const reports = useApiResource("my-reports", listMyReports);
  const toast = useToast();
  // a new key empties the upload form after a successful upload
  const [formKey, setFormKey] = useState(0);

  const upload = async (report: NewReport) => {
    await uploadReport(report);
    toast("Report uploaded");
    setFormKey((key) => key + 1);
    reports.reload();
  };

  return (
    <main className={layoutStyles.page}>
      <PageHead title="Reports" sub="Your doctor reads these before your consultation." />
      <div className={styles.grid}>
        <Card title="Upload a report">
          <LabReportUpload
            key={formKey}
            dateLabel="Date on the report"
            chooseLabel="Choose a PDF or photo"
            submitLabel="Upload report"
            tooOldAdvice="Book a home test for a fresh one."
            onUpload={upload}
          />
        </Card>

        <Card title="Your reports">
          {reports.loading && <LoadingSkeleton />}
          {reports.error && <ErrorNotice message={reports.error} onRetry={reports.reload} />}
          {!reports.loading && !reports.error && reports.data === null && <p className={styles.text}>Reports are not available yet.</p>}
          {reports.data?.length === 0 && <p className={styles.text}>No reports yet. Upload one above, or book a home test.</p>}
          {reports.data && reports.data.length > 0 && (
            <ul className={styles.people}>
              {reports.data.map((report) => (
                <li key={report.id}>
                  <ReportRow report={report} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
