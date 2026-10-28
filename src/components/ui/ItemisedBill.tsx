import type { ReactNode } from "react";
import styles from "./ItemisedBill.module.css";

export type BillLine = { label: ReactNode; note?: ReactNode; amount: ReactNode };

/**
 * An itemised price as a definition list: each line with an optional note under it, the amount on
 * the right, and the total last in display type. Amounts arrive already worded (formatRupees);
 * the bill never adds anything up.
 */
export default function ItemisedBill({ lines, total }: { lines: (BillLine & { key: string })[]; total: BillLine }) {
  return (
    <dl className={styles.bill}>
      {lines.map((line) => (
        <div key={line.key}>
          <dt>
            {line.label}
            {line.note && <small>{line.note}</small>}
          </dt>
          <dd className="num">{line.amount}</dd>
        </div>
      ))}
      <div className={styles.total}>
        <dt>
          {total.label}
          {total.note && <small>{total.note}</small>}
        </dt>
        <dd className="num">{total.amount}</dd>
      </div>
    </dl>
  );
}
