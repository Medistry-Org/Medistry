/**
 * The checkout's last screen, once the backend has verified the payment (the page heading says
 * "Payment received"): what happens next, what was paid for, the payment reference to quote to
 * support, and one way on.
 */

import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Card from "@/components/ui/Card";
import { formatRupees } from "@/lib/format/money";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./PaymentReceived.module.css";

export type PaidOrder = {
  title: string;
  amountPaise: number;
  paymentReference: string;
};

export default function PaymentReceived({
  paid,
  nextStep,
  continueTo,
}: {
  paid: PaidOrder;
  nextStep: string;
  continueTo: string;
}) {
  return (
    <Card>
      <div className={styles.receipt}>
        <CheckCircle
          size={44}
          weight="duotone"
          className={styles.mark}
          aria-hidden="true"
        />
        <p className={styles.next}>{nextStep}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Paid for</dt>
            <dd>{paid.title}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd className="num">{formatRupees(paid.amountPaise / 100)}</dd>
          </div>
          <div>
            <dt>Payment reference</dt>
            <dd className={styles.reference}>{paid.paymentReference}</dd>
          </div>
        </dl>
        <Link href={continueTo} className={`btn ${formStyles.go}`}>
          <span>Continue</span>
          <span className="well" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </Link>
      </div>
    </Card>
  );
}
