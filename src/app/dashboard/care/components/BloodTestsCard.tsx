/**
 * Blood tests on Care: the way into home tests and reports, which live on their own pages
 * (/dashboard/lab-tests and /dashboard/reports). Before the first consultation it suggests sharing
 * a recent report or booking a home test.
 */

import Link from "next/link";
import { CaretRight, FileText, Flask } from "@phosphor-icons/react/dist/ssr";
import Card from "@/components/ui/Card";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../CarePage.module.css";

export default function BloodTestsCard({ hasTeam }: { hasTeam: boolean }) {
  return (
    <Card
      title="Blood tests"
      className={`${styles.card} ${styles.labs}`}
      action={
        hasTeam && (
          <Link href="/dashboard/lab-tests/book" className={formStyles.link}>
            Book a test <CaretRight size={15} />
          </Link>
        )
      }
    >
      {hasTeam ? (
        <>
          <ul className={styles.people}>
            <li>
              <Link href="/dashboard/lab-tests" className={styles.row}>
                <span className={styles.plate} aria-hidden="true">
                  <Flask size={17} />
                </span>
                <span className={styles.rowText}>
                  <strong>Home blood tests</strong>
                  <span>Booked tests and where they are</span>
                </span>
                <CaretRight size={16} className={styles.go} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/reports" className={styles.row}>
                <span className={styles.plate} aria-hidden="true">
                  <FileText size={17} />
                </span>
                <span className={styles.rowText}>
                  <strong>Reports</strong>
                  <span>Your results and the reports you shared</span>
                </span>
                <CaretRight size={16} className={styles.go} aria-hidden="true" />
              </Link>
            </li>
          </ul>
          <p className={`${styles.foot} ${styles.labsFoot}`}>Your doctor orders the tests you need, and our partner lab collects the sample at home.</p>
        </>
      ) : (
        <div className={styles.stack}>
          <p className={styles.text}>Share a recent report, or book a home test. Your doctor reads it before your consultation.</p>
          <div className={styles.pair}>
            <Link href="/dashboard/reports" className={`btn btn--ghost ${styles.pill}`}>
              <FileText size={17} /> Share a report
            </Link>
            <Link href="/dashboard/lab-tests/book" className={`btn btn--ghost ${styles.pill}`}>
              <Flask size={17} /> Book a home test
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
