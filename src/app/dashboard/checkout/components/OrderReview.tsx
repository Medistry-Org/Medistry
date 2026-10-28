"use client";

import { ArrowRight, LockSimple } from "@phosphor-icons/react";
import Card from "@/components/ui/Card";
import ErrorNotice from "@/components/ui/ErrorNotice";
import ItemisedBill from "@/components/ui/ItemisedBill";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { formatRupees } from "@/lib/format/money";
import type { PaymentOrder } from "@/types/payment";
import styles from "./OrderReview.module.css";

export type CheckoutNotice = { tone: "calm" | "error"; text: string } | null;

/**
 * The order as the backend priced it: its title, line items and total (never added up here), a
 * note on who processes the payment, and one pay button styled as Arhaan's primary action.
 * `onPay` receives the button's resolved colour so Razorpay's window matches it.
 */
export default function OrderReview({
  order,
  busyLabel,
  notice,
  awaitingConfirmation,
  onPay,
}: {
  order: PaymentOrder;
  busyLabel: string | null;
  notice: CheckoutNotice;
  awaitingConfirmation: boolean;
  onPay: (themeColour: string) => void;
}) {
  const total = formatRupees(order.amountPaise / 100);
  const idleLabel = awaitingConfirmation ? "Confirm payment" : notice?.tone === "error" ? `Try again, pay ${total}` : `Pay ${total}`;

  return (
    <Card title={order.title}>
      <div className={styles.review}>
        <ItemisedBill
          lines={order.lineItems.map((item, index) => ({ key: `${index}-${item.label}`, label: item.label, amount: formatRupees(item.amountPaise / 100) }))}
          total={{ label: "To pay now", amount: total }}
        />
        <p className={styles.secure}>
          <LockSimple size={16} weight="bold" aria-hidden="true" />
          <span>Payments are processed securely by Razorpay.</span>
        </p>
        {notice &&
          (notice.tone === "error" ? (
            <ErrorNotice message={notice.text} />
          ) : (
            <p className={styles.calm} role="status">
              {notice.text}
            </p>
          ))}
        <button
          type="button"
          className={`btn ${formStyles.go}`}
          data-busy={busyLabel !== null}
          aria-busy={busyLabel !== null}
          onClick={(event) => busyLabel === null && onPay(getComputedStyle(event.currentTarget).getPropertyValue("--btn-bg").trim())}
        >
          <span>{busyLabel ?? idleLabel}</span>
          <span className="well" aria-hidden="true">
            {busyLabel !== null ? <i className={formStyles.spin} /> : <ArrowRight size={18} />}
          </span>
        </button>
      </div>
    </Card>
  );
}
