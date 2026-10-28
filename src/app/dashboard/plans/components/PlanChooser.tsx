"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import Card from "@/components/ui/Card";
import ItemisedBill from "@/components/ui/ItemisedBill";
import SegmentedControl from "@/components/ui/SegmentedControl";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import { formatRupees } from "@/lib/format/money";
import type { SubscriptionPlan } from "@/types/subscription";
import styles from "./PlanChooser.module.css";

const monthsWord = (months: number) => (months === 1 ? "month" : "months");

/** Where "Subscribe now" goes: the shared checkout, which asks the backend for the price. */
const checkoutHref = (planId: number) => `/dashboard/checkout?${new URLSearchParams({ purpose: "PLAN", referenceId: String(planId), returnTo: "/dashboard" })}`;

/**
 * Choosing a plan, shaped like Arhaan's Planner: the lengths as a segmented control (number over
 * unit), then the chosen plan's name, its perks itemised as "Included" and its price last, then the
 * one action. Plan names, perks and prices come from GET /api/subscriptions/plans.
 */
export default function PlanChooser({ plans }: { plans: SubscriptionPlan[] }) {
  const [chosenId, setChosenId] = useState(String(plans[0].id));
  const plan = plans.find((p) => String(p.id) === chosenId) ?? plans[0];
  const perMonth = plan.priceRupees && plan.durationMonths > 1 ? `About ${formatRupees(plan.priceRupees / plan.durationMonths)} a month` : undefined;

  return (
    <Card title="Choose your subscription plan">
      <div className={styles.chooser}>
        <p className={styles.text}>Select a plan to unlock full doctor consultations.</p>

        {plans.length > 1 && (
          <div className={styles.lengths}>
            <SegmentedControl
              label="Plan length"
              value={chosenId}
              onChange={setChosenId}
              options={plans.map((p) => ({
                value: String(p.id),
                label: (
                  <>
                    <span className={styles.lengthNum}>{p.durationMonths}</span>
                    <span className={styles.lengthUnit}>{monthsWord(p.durationMonths)}</span>
                  </>
                ),
              }))}
            />
          </div>
        )}

        <div className={styles.chosen} aria-live="polite">
          <p className={styles.planName}>{plan.name}</p>
          <p className={styles.meta}>
            <span className="num">{plan.durationMonths}</span> {monthsWord(plan.durationMonths)}
          </p>
        </div>

        <ItemisedBill
          lines={plan.perks.map((perk, index) => ({ key: `${plan.id}-${index}`, label: perk, amount: "Included" }))}
          total={{ label: "Plan price", note: perMonth, amount: plan.priceRupees != null ? formatRupees(plan.priceRupees) : "Free" }}
        />
        {plan.perks.length === 0 && <p className={styles.foot}>No benefits listed for this plan.</p>}

        <div className={styles.action}>
          {plan.isActive ? (
            <Link href={checkoutHref(plan.id)} className={`btn ${formStyles.go}`}>
              <span>Subscribe now</span>
              <span className="well" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </Link>
          ) : (
            <button type="button" className={`btn ${formStyles.go}`} disabled>
              <span>Unavailable</span>
              <span className="well" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </button>
          )}
          <p className={styles.foot}>{plan.isActive ? "You see the itemised price before you pay." : "This plan is currently unavailable"}</p>
        </div>
      </div>
    </Card>
  );
}
