/**
 * /dashboard/checkout?purpose=PLAN|LAB_BOOKING|CONSULTATION_FEE&referenceId=<id>&returnTo=<path>
 * A server page so it can carry metadata; the flow reads the URL with useSearchParams, which needs
 * the Suspense boundary here.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import layoutStyles from "@/components/ui/styles/AppLayout.module.css";
import CheckoutFlow from "./components/CheckoutFlow";
import styles from "./CheckoutPage.module.css";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <main className={layoutStyles.page}>
      <div className={styles.column}>
        <Suspense fallback={<LoadingSkeleton />}>
          <CheckoutFlow />
        </Suspense>
      </div>
    </main>
  );
}
