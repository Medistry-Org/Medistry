"use client";

/**
 * One home blood test: where it is (Arhaan's lab steps), the collector and their live tracking link
 * once assigned, the collection details, each test's status once the lab has the sample, and the
 * report when it is ready. The time can be changed (twice at most) or the test cancelled until a
 * collector is assigned. An unpaid booking shows how long its slot is held and the way to pay.
 */

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, DownloadSimple, MapPin, Phone } from "@phosphor-icons/react";
import { useApiResource } from "@/hooks/useApiResource";
import { useNow } from "@/hooks/useNow";
import { getLabBooking, getLabReportUrl } from "@/services/labTestService";
import { errorMessage } from "@/lib/http/apiClient";
import { clockTime, timeUntil } from "@/lib/format/dateTime";
import { formatRupees } from "@/lib/format/money";
import type { LabBooking, LabTestStatus } from "@/types/labTest";
import Card from "@/components/ui/Card";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageHead from "@/components/ui/PageHead";
import { useToast } from "@/components/ui/ToastProvider";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import CancelSheet from "../components/CancelSheet";
import LabStatusTracker from "../components/LabStatusTracker";
import RescheduleSheet from "../components/RescheduleSheet";
import { collectionWindow, LAB_STATUS_WORDS, labCheckoutHref } from "../components/labBookingWording";
import styles from "../LabTests.module.css";

const BACK = { href: "/dashboard/lab-tests", label: "Blood tests" };

const TEST_WORDS: Record<LabTestStatus, string> = { PENDING: "In progress", COMPLETED: "Done", REJECTED: "Sample rejected", DISMISSED: "Not done" };

/** Why the time cannot be changed, or null when it can. */
function rescheduleBlock(booking: LabBooking) {
  if (booking.reschedulesLeft <= 0) return "This test has been moved twice, the most the lab allows.";
  if (!booking.canReschedule) return "The time cannot be changed once a collector is assigned.";
  return null;
}

export default function LabBookingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const booking = useApiResource(`lab-booking-${bookingId}`, () => getLabBooking(bookingId));
  const toast = useToast();
  const now = useNow();
  const [sheet, setSheet] = useState<"move" | "cancel" | null>(null);
  const [opening, setOpening] = useState(false);
  // a stable close, so the open sheet does not re-run its effects on every tick of the clock
  const closeSheet = useCallback(() => setSheet(null), []);
  const b = booking.data;

  if (booking.loading) {
    return (
      <main className={layoutStyles.page}>
        <LoadingSkeleton />
      </main>
    );
  }

  if (booking.error || !b) {
    return (
      <main className={layoutStyles.page}>
        <PageHead title="Blood test" back={BACK} />
        {booking.error ? <ErrorNotice message={booking.error} onRetry={booking.reload} /> : <p className={styles.text}>This booking is not available.</p>}
      </main>
    );
  }

  const holdOpen = b.status === "PAYMENT_PENDING" && b.holdExpiresAt !== null && Date.parse(b.holdExpiresAt) > now;
  const changeable = b.status === "BOOKED" || b.status === "COLLECTOR_ASSIGNED";
  const blocked = rescheduleBlock(b);

  const openReport = async () => {
    // open the tab inside the tap, so the browser does not block it, then point it at the fresh link
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const url = await getLabReportUrl(b.id);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (caught) {
      tab?.close();
      toast(errorMessage(caught));
    } finally {
      setOpening(false);
    }
  };

  const updated = (next: LabBooking, message: string) => {
    booking.setData(next);
    setSheet(null);
    toast(message);
  };

  return (
    <main className={`${layoutStyles.page} ${styles.page}`}>
      <PageHead title={b.packageName} back={BACK} sub={<span className="num">{collectionWindow(b)}, at home</span>} />

      <div className={styles.grid}>
        <Card title={LAB_STATUS_WORDS[b.status]} className={styles.card}>
          <LabStatusTracker status={b.status} />

          {holdOpen && (
            <>
              <p className={styles.text}>
                Your time is held until <span className="num">{clockTime(new Date(b.holdExpiresAt!))}</span>, {timeUntil(b.holdExpiresAt!, now)}. Pay before then to book it.
              </p>
              <Link href={labCheckoutHref(b)} className={`btn ${formStyles.go}`}>
                <span>Pay {formatRupees(b.price.total)} and book</span>
                <span className="well" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </Link>
            </>
          )}
          {(b.status === "EXPIRED" || (b.status === "PAYMENT_PENDING" && !holdOpen)) && (
            <p className={styles.text}>
              The 30-minute hold ended before payment. <Link href="/dashboard/lab-tests/book" className={formStyles.link}>Book again</Link>
            </p>
          )}
          {b.status === "CANCELLED" && <p className={styles.text}>This test was cancelled.</p>}

          {b.collector && changeable && (
            <div className={styles.fast}>
              <strong>{b.collector.name}</strong> from our partner lab will collect your sample.{" "}
              <a href={`tel:${b.collector.phone}`} className={formStyles.link}>
                <Phone size={16} /> Call
              </a>
            </div>
          )}
          {b.collector?.trackingUrl && changeable && (
            <a href={b.collector.trackingUrl} target="_blank" rel="noopener noreferrer" className={`btn ${formStyles.go}`}>
              <span>Track your collector</span>
              <span className="well" aria-hidden="true">
                <MapPin size={18} />
              </span>
            </a>
          )}
          {b.fastingNote && (b.status === "BOOKED" || b.status === "COLLECTOR_ASSIGNED" || holdOpen) && <p className={styles.fast}>{b.fastingNote}</p>}

          {b.status === "REPORT_READY" && (
            <button type="button" className={`btn ${formStyles.go}`} onClick={openReport} data-busy={opening} aria-busy={opening}>
              <span>{opening ? "Opening" : "Download report"}</span>
              <span className="well" aria-hidden="true">
                {opening ? <i className={formStyles.spin} /> : <DownloadSimple size={18} />}
              </span>
            </button>
          )}

          {changeable && (
            <div className={styles.actions}>
              <div className={styles.pair}>
                <button type="button" className={`btn btn--ghost ${styles.pill}`} disabled={blocked !== null} onClick={() => setSheet("move")}>
                  Change time
                </button>
                <button type="button" className={`btn btn--ghost ${styles.pill}`} disabled={!b.canCancel} onClick={() => setSheet("cancel")}>
                  Cancel test
                </button>
              </div>
              {blocked && <p className={styles.foot}>{blocked}</p>}
            </div>
          )}
        </Card>

        <Card title="Collection" className={styles.card}>
          <dl className={styles.facts}>
            <div className={styles.wide}>
              <dt>When</dt>
              <dd className="num">{collectionWindow(b)}</dd>
            </div>
            <div className={styles.wide}>
              <dt>Where</dt>
              <dd>{b.address}</dd>
            </div>
            <div>
              <dt>For</dt>
              <dd>
                {b.patient.name}, <span className="num">{b.patient.age}</span>, {b.patient.gender.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt>{b.paymentRequired ? "Price" : "Paid by"}</dt>
              <dd className="num">{b.paymentRequired ? formatRupees(b.price.total) : "Your plan"}</dd>
            </div>
            {b.partnerBookingId && (
              <div>
                <dt>Lab booking number</dt>
                <dd className="num">{b.partnerBookingId}</dd>
              </div>
            )}
          </dl>
        </Card>

        {b.tests.length > 0 && (
          <Card title="Tests" className={styles.card}>
            <ul className={styles.tests}>
              {b.tests.map((test) => (
                <li key={test.code}>
                  {test.name}
                  <span>{TEST_WORDS[test.status]}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <RescheduleSheet
        booking={b}
        open={sheet === "move"}
        onClose={closeSheet}
        onMoved={(next) => updated(next, `Moved to ${collectionWindow(next)}`)}
      />
      <CancelSheet booking={b} open={sheet === "cancel"} onClose={closeSheet} onCancelled={(next) => updated(next, "Test cancelled")} />
    </main>
  );
}
