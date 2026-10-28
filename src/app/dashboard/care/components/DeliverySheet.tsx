/** One medicine delivery in full: where it is, what is in it, and the tracking number. */

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { shortDate } from "@/lib/format/dateTime";
import type { MedicineOrder } from "@/types/carePlan";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "../CarePage.module.css";
import StepLine from "./StepLine";
import { DELIVERY_STEPS, deliveryStepIndex, reachedAt } from "./deliveryStatus";

function statusSentence(order: MedicineOrder) {
  if (order.status === "DELIVERED") return `Delivered ${shortDate(reachedAt(order, "DELIVERED") ?? order.placedAt)} from Medistry's pharmacy.`;
  if (order.status === "DISPATCHED") {
    const sent = reachedAt(order, "DISPATCHED") ?? order.placedAt;
    return `From Medistry's pharmacy. Handed to the courier ${shortDate(sent)}${order.expectedAt ? `, due ${shortDate(order.expectedAt)}` : ""}.`;
  }
  const lastNote = order.history.at(-1)?.note;
  return lastNote ? `From Medistry's pharmacy. ${lastNote}.` : "From Medistry's pharmacy.";
}

export default function DeliverySheet({ order }: { order: MedicineOrder }) {
  return (
    <div className={styles.sheetBody}>
      <p className={styles.sheetMeta}>{statusSentence(order)}</p>
      <StepLine
        label="Delivery status"
        steps={DELIVERY_STEPS.map((label, i) => ({ label, when: order.history[i] ? shortDate(order.history[i].at) : null }))}
        currentIndex={deliveryStepIndex(order)}
      />
      <div className={styles.items}>
        <p className={styles.groupHead}>In this delivery</p>
        <ul>
          {order.items.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      {order.trackingNo && (
        <dl className={styles.facts}>
          <div>
            <dt>Tracking number</dt>
            <dd className="num">{order.trackingNo}</dd>
          </div>
        </dl>
      )}
      {order.status === "DISPATCHED" && order.trackingUrl && (
        <a href={order.trackingUrl} className={`btn ${formStyles.go}`} target="_blank" rel="noopener noreferrer">
          <span>Track with the courier</span>
          <span className="well" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </a>
      )}
      <p className={styles.foot}>Scan the QR seal on each pack to check it is genuine.</p>
    </div>
  );
}
