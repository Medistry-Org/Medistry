"use client";

/**
 * Choosing a plan, shaped like Arhaan's Planner: the lengths as a segmented control (number over
 * unit), then the chosen plan's name, its perks itemised as "Included" and its price last, then the
 * one action. Plan names, perks and prices come from GET /api/subscriptions/plans. When the doctor
 * recommended a plan in the consultation, it comes first with their note, already chosen.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import ItemisedBill from "@/app/patient-dashboard/components/ItemisedBill";
import Card from "@/components/ui/Card";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { formatRupees } from "@/lib/format/money";
import { checkoutHref } from "@/lib/payments/checkoutHref";
import type { RecommendedPlan, SubscriptionPlan } from "@/types/subscription";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./PlanChooser.module.css";

const monthsWord = (months: number) => (months === 1 ? "month" : "months");

export default function PlanChooser({
  plans,
  recommended,
}: {
  plans: SubscriptionPlan[];
  recommended: RecommendedPlan | null;
}) {
  const recommendedPlan = recommended
    ? (plans.find((candidate) => candidate.id === recommended.planId) ?? null)
    : null;
  const [chosenId, setChosenId] = useState(
    String((recommendedPlan ?? plans[0]).id),
  );
  const plan =
    plans.find((candidate) => String(candidate.id) === chosenId) ?? plans[0];
  const perMonth =
    plan.priceRupees && plan.durationMonths > 1
      ? `About ${formatRupees(plan.priceRupees / plan.durationMonths)} a month`
      : undefined;

  return (
    <Card title="Choose your subscription plan">
      <div className={styles.chooser}>
        {recommended && recommendedPlan && (
          <div className={styles.recommended}>
            <p className={styles.recommendedTitle}>
              {recommended.doctorName || "Your doctor"} recommends{" "}
              {recommendedPlan.name}
            </p>
            {recommended.note && (
              <p className={styles.recommendedNote}>{recommended.note}</p>
            )}
          </div>
        )}
        <p className={styles.text}>
          Select a plan to unlock full doctor consultations.
        </p>

        {plans.length > 1 && (
          <div className={styles.lengths}>
            <SegmentedControl
              label="Plan length"
              value={chosenId}
              onChange={setChosenId}
              options={plans.map((option) => ({
                value: String(option.id),
                label: (
                  <>
                    <span className={styles.lengthNum}>
                      {option.durationMonths}
                    </span>
                    <span className={styles.lengthUnit}>
                      {monthsWord(option.durationMonths)}
                    </span>
                  </>
                ),
              }))}
            />
          </div>
        )}

        <div className={styles.chosen} aria-live="polite">
          <p className={styles.planName}>{plan.name}</p>
          <p className={styles.meta}>
            <span className="num">{plan.durationMonths}</span>{" "}
            {monthsWord(plan.durationMonths)}
            {plan.id === recommendedPlan?.id && ", recommended by your doctor"}
          </p>
        </div>

        <ItemisedBill
          lines={plan.perks.map((perk, index) => ({
            key: `${plan.id}-${index}`,
            label: perk,
            amount: "Included",
          }))}
          total={{
            label: "Plan price",
            note: perMonth,
            amount:
              plan.priceRupees != null
                ? formatRupees(plan.priceRupees)
                : "Free",
          }}
        />
        {plan.perks.length === 0 && (
          <p className={styles.foot}>No benefits listed for this plan.</p>
        )}

        <div className={styles.action}>
          {plan.isActive ? (
            <Link
              href={checkoutHref({
                purpose: "PLAN",
                referenceId: plan.id,
                returnTo: "/patient-dashboard",
              })}
              className={`btn ${formStyles.go}`}
            >
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
          <p className={styles.foot}>
            {plan.isActive
              ? "You see the itemised price before you pay."
              : "This plan is currently unavailable"}
          </p>
        </div>
      </div>
    </Card>
  );
}
