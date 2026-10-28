"use client";

/**
 * Blood tests: the patient's home blood tests through Redcliffe Labs. Tests under way show
 * Arhaan's lab status steps; earlier ones are one row each. The one action is "Book a home test".
 */

import Link from "next/link";
import { CaretRight, FileArrowUp, Flask } from "@phosphor-icons/react";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { listMyLabBookings } from "@/services/labTestService";
import { shortDate } from "@/lib/format/dateTime";
import Card from "@/components/ui/Card";
import PageHead from "@/components/ui/PageHead";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import OngoingLabCard from "./components/OngoingLabCard";
import { isOngoing, LAB_STATUS_WORDS } from "./components/labBookingWording";
import styles from "./LabTests.module.css";

const BOOK_HREF = "/dashboard/lab-tests/book";

export default function LabTestsPage() {
  const bookings = useApiResource("lab-bookings", listMyLabBookings);
  const now = useNow();
  const all = bookings.data ?? [];
  const ongoing = all.filter(isOngoing).sort((a, b) => a.collectionStartsAt.localeCompare(b.collectionStartsAt));
  const earlier = all.filter((b) => !isOngoing(b)).sort((a, b) => b.collectionStartsAt.localeCompare(a.collectionStartsAt));

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead
        title="Blood tests"
        action={
          <Link href={BOOK_HREF} className={`btn btn--ghost ${styles.pill}`}>
            <Flask size={17} /> Book a home test
          </Link>
        }
      />

      {bookings.loading && <LoadingSkeleton />}
      {bookings.error && <ErrorNotice message={bookings.error} onRetry={bookings.reload} />}

      {!bookings.loading && !bookings.error && (
        <div className={styles.grid}>
          {bookings.data === null && (
            <Card className={styles.card}>
              <p className={styles.text}>Booking home blood tests is not available yet.</p>
            </Card>
          )}

          {bookings.data !== null && all.length === 0 && (
            <Card className={styles.card}>
              <p className={styles.text}>Upload a recent report, or book a home test. Our partner lab collects the sample at home.</p>
              <div className={styles.pair}>
                <Link href="/dashboard/reports" className={`btn btn--ghost ${styles.pill}`}>
                  <FileArrowUp size={17} /> Upload a report
                </Link>
                <Link href={BOOK_HREF} className={`btn btn--ghost ${styles.pill}`}>
                  <Flask size={17} /> Book a home test
                </Link>
              </div>
            </Card>
          )}

          {ongoing.map((booking) => (
            <OngoingLabCard key={booking.id} booking={booking} now={now} />
          ))}

          {earlier.length > 0 && (
            <Card title="Earlier tests" className={styles.card}>
              <ul className={styles.people}>
                {earlier.map((booking) => (
                  <li key={booking.id}>
                    <Link href={`/dashboard/lab-tests/${booking.id}`} className={styles.row}>
                      <span className={styles.plate} aria-hidden="true">
                        <Flask size={17} />
                      </span>
                      <span className={styles.rowText}>
                        <strong>{booking.packageName}</strong>
                        <span>
                          {LAB_STATUS_WORDS[booking.status]}, <span className="num">{shortDate(booking.collectionStartsAt)}</span>
                        </span>
                      </span>
                      <CaretRight size={17} className={styles.go} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
