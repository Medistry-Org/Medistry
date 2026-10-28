"use client";

/**
 * Step 5: check and pay. Every choice with a way to change it, then the price. "Continue" holds the
 * time with the lab for 30 minutes and returns the lab's own price; paying goes to the checkout,
 * which comes back to the booking's page. A test a paid lab plan covers is booked at once instead.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { useNow } from "@/hooks/useNow";
import { errorMessage } from "@/lib/http/apiClient";
import { clockTime, timeUntil } from "@/lib/format/dateTime";
import { formatRupees } from "@/lib/format/money";
import type { LabBooking } from "@/types/labTest";
import { spokenDay } from "@/components/ui/SlotPicker";
import { useToast } from "@/components/ui/ToastProvider";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import type { LabBookingFlow, LabBookingStep } from "../useLabBookingFlow";
import PackageTestsDetails from "./PackageTestsDetails";
import styles from "./LabBookingSteps.module.css";

const capital = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export default function ReviewStep({ flow, checkoutHref }: { flow: LabBookingFlow; checkoutHref: (booking: LabBooking) => string }) {
  const router = useRouter();
  const toast = useToast();
  const now = useNow(10_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chosenPackage: labPackage, address, patient, slot, held } = flow;
  if (!labPackage || !address || !patient || !slot) return null;

  const at = new Date(slot.at);
  const when = `${capital(spokenDay(at))}, ${clockTime(at)}`;
  // the hold as long as it lasts; null before it is made and once its 30 minutes are up
  const liveHold = held?.holdExpiresAt && Date.parse(held.holdExpiresAt) > now ? held : null;
  const covered = labPackage.coveredByPlan;

  const hold = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const booking = await flow.hold();
      if (!booking.paymentRequired) {
        toast(`Home blood test booked for ${spokenDay(at)}, ${clockTime(at)}`);
        router.push(`/dashboard/lab-tests/${booking.id}`);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const rows: { label: string; value: string; step: LabBookingStep }[] = [
    { label: "Test", value: labPackage.name, step: "package" },
    { label: "When", value: when, step: "time" },
    { label: "Where", value: address.addressLine, step: "address" },
    { label: "For", value: `${patient.name}, ${patient.age}, ${patient.gender.toLowerCase()}`, step: "patient" },
  ];

  return (
    <>
      <dl className={styles.facts}>
        {rows.map((row) => (
          <div key={row.label}>
            <div>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
            <button type="button" className={formStyles.link} onClick={() => flow.goTo(row.step)}>
              Change
            </button>
          </div>
        ))}
      </dl>

      <PackageTestsDetails labPackage={labPackage} />

      <dl className={styles.bill}>
        <div>
          <dt>
            {labPackage.name}
            <small>{covered ? "Covered by your plan" : "Home blood test"}</small>
          </dt>
          <dd className="num">{covered ? formatRupees(0) : formatRupees(liveHold ? liveHold.price.packagePrice : labPackage.price)}</dd>
        </div>
        {liveHold && liveHold.price.discount > 0 && (
          <div>
            <dt>Discount</dt>
            <dd className="num">-{formatRupees(liveHold.price.discount)}</dd>
          </div>
        )}
        {liveHold && (
          <div>
            <dt>Home collection</dt>
            <dd className="num">{liveHold.price.collectionCharge > 0 ? formatRupees(liveHold.price.collectionCharge) : "Free"}</dd>
          </div>
        )}
        <div className={styles.total}>
          <dt>To pay now</dt>
          <dd className="num">{covered ? formatRupees(0) : formatRupees(liveHold ? liveHold.price.total : labPackage.price)}</dd>
        </div>
      </dl>

      {labPackage.fastingNote && <p className={styles.fast}>{labPackage.fastingNote}</p>}

      {error && (
        <div>
          <p className={formStyles.err} role="alert">
            <WarningCircle size={16} weight="bold" aria-hidden="true" />
            <span>{error}</span>
          </p>
          <button type="button" className={formStyles.link} onClick={() => flow.goTo("time")}>
            Choose another time
          </button>
        </div>
      )}

      {liveHold ? (
        <>
          <p className={styles.sheetMeta}>
            <span>
              Your time is held until <span className="num">{clockTime(new Date(liveHold.holdExpiresAt!))}</span>. Pay {timeUntil(liveHold.holdExpiresAt!, now)} to keep it.
            </span>
          </p>
          <Link href={checkoutHref(liveHold)} className={`btn ${formStyles.go}`}>
            <span>Pay {formatRupees(liveHold.price.total)} and book</span>
            <span className="well" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
          </Link>
        </>
      ) : (
        <>
          <button type="button" className={`btn ${formStyles.go}`} onClick={hold} data-busy={busy} aria-busy={busy}>
            <span>{busy ? "Holding your time" : covered ? "Book the test" : "Continue to payment"}</span>
            <span className="well" aria-hidden="true">
              {busy ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
            </span>
          </button>
          <p className={styles.foot}>
            {held ? "The 30-minute hold ended. Continue to hold this time again." : covered ? "Your plan covers this test." : "The lab holds your time for 30 minutes while you pay, and confirms the price."}
          </p>
        </>
      )}
    </>
  );
}
