/**
 * Past payments, as Arhaan's "Invoices" list in Plan and payments: what was paid for, the date and
 * invoice number, the amount, and View when the backend has a PDF. `payments` is null while the
 * backend has no GET /api/payments yet.
 */

import Card from "@/components/ui/Card";
import { shortDate } from "@/lib/format/dateTime";
import { formatRupees } from "@/lib/format/money";
import type { PaymentRecord } from "@/types/payment";
import styles from "./InvoiceList.module.css";

export default function InvoiceList({
  payments,
}: {
  payments: PaymentRecord[] | null;
}) {
  return (
    <Card title="Invoices">
      {payments === null ? (
        <p className={styles.text}>Invoices are not available yet.</p>
      ) : payments.length === 0 ? (
        <p className={styles.text}>No payments yet.</p>
      ) : (
        <ul className={styles.invoices}>
          {payments.map((payment) => (
            <li key={payment.id}>
              <div>
                <strong>{payment.title}</strong>
                <span className="num">
                  {[
                    payment.paidAt && shortDate(payment.paidAt),
                    payment.invoiceNumber,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
              <span className={`${styles.amount} num`}>
                {formatRupees(payment.amountPaise / 100)}
              </span>
              {payment.invoiceUrl && (
                <a
                  href={payment.invoiceUrl}
                  className={styles.view}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View invoice ${payment.invoiceNumber}`}
                >
                  View
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
