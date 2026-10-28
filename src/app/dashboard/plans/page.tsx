"use client";

/**
 * /dashboard/plans: the patient's plan and payments. With an active plan it shows that plan;
 * otherwise the plan chooser, which sends the chosen plan to /dashboard/checkout (the plan is
 * activated by the backend only after Razorpay confirms the payment). Invoices sit underneath.
 */

import Card from "@/components/ui/Card";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageHead from "@/components/ui/PageHead";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import { useApiResource } from "@/hooks/useApiResource";
import { ApiError } from "@/lib/http/apiClient";
import { getSessionUser } from "@/lib/session/authSession";
import { listPayments } from "@/services/paymentService";
import { getSubscriptionStatus, listPlans } from "@/services/subscriptionService";
import CurrentPlan from "./components/CurrentPlan";
import InvoiceList from "./components/InvoiceList";
import PlanChooser from "./components/PlanChooser";
import styles from "./PlansPage.module.css";

/** An endpoint the backend has not built yet answers 404: treat it as "nothing to show". */
const nullWhenMissing = (error: unknown) => {
  if (error instanceof ApiError && error.isMissingEndpoint) return null;
  throw error;
};

async function loadPlansAndStatus() {
  const userId = getSessionUser()?.userId ?? null;
  const [plans, status] = await Promise.all([listPlans(), userId === null ? null : getSubscriptionStatus(userId).catch(nullWhenMissing)]);
  return { plans, status };
}

export default function PlansPage() {
  const planState = useApiResource("plans", loadPlansAndStatus);
  const payments = useApiResource("payments", () => listPayments().catch(nullWhenMissing));

  const content = () => {
    if (planState.error) return <ErrorNotice message={planState.error} onRetry={planState.reload} />;
    if (!planState.data) return <LoadingSkeleton />;
    const { plans, status } = planState.data;
    if (status?.hasActivePlan) return <CurrentPlan plan={plans.find((plan) => plan.id === status.planId) ?? null} />;
    if (plans.length === 0)
      return (
        <Card title="Choose your subscription plan">
          <p className={styles.text}>No plans are available right now.</p>
        </Card>
      );
    return <PlanChooser plans={plans} />;
  };

  return (
    <main className={layoutStyles.page}>
      <PageHead title="Plan and payments" back={{ href: "/dashboard", label: "Home" }} />
      <div className={styles.stack}>
        {content()}
        {payments.error ? <ErrorNotice message={payments.error} onRetry={payments.reload} /> : !payments.loading && <InvoiceList payments={payments.data} />}
      </div>
    </main>
  );
}
