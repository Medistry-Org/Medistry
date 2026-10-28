/**
 * One lab plan on /pricing: its badge on a 7px plate, name, price, what it includes (Arhaan's
 * "included" list with ticks) and the one action. The recommended plan carries the signal ring.
 */

import { ArrowRight, Check } from "@phosphor-icons/react/dist/ssr";
import { formatRupees } from "@/lib/format/money";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import surfaceStyles from "@/components/ui/styles/CardSurface.module.css";
import type { LabPlan } from "../labPlans";
import styles from "../PricingPage.module.css";

export default function LabPlanCard({
  plan,
  onChoose,
}: {
  plan: LabPlan;
  onChoose: (plan: LabPlan) => void;
}) {
  return (
    <article
      className={`${surfaceStyles.card} ${styles.plan}`}
      data-recommended={plan.recommended || undefined}
    >
      <span className={styles.tag}>{plan.badge}</span>
      <h2 className={styles.planName}>{plan.name}</h2>
      <p className={styles.price}>
        <span className="num">{formatRupees(plan.price)}</span>{" "}
        <small>/ package</small>
      </p>
      <ul className={styles.incl}>
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={16} weight="bold" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`btn ${formStyles.go}`}
        onClick={() => onChoose(plan)}
      >
        <span>Choose Plan &amp; Proceed</span>
        <span className="well" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </button>
    </article>
  );
}
