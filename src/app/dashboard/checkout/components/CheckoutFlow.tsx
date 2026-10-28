"use client";

/**
 * The checkout for every purpose (PLAN, LAB_BOOKING, CONSULTATION_FEE), driven by the URL:
 *   ?purpose=PLAN&referenceId=<id>&returnTo=/dashboard
 *
 * 1. Asks the backend for an order (it decides the amount), and shows it for review.
 * 2. Opens Razorpay Checkout with that order.
 * 3. Paid: the backend verifies the signature and fulfils the purpose, then we go to returnTo.
 *    Closed: back to the review with a calm line. Failed: the reason, and the button tries again.
 *    Paid but not yet confirmed: the button retries the confirmation only, never a second payment.
 * Until the backend has /api/payments/*, the order request 404s and the page says payment is not
 * available yet. Nothing is ever activated without a verified payment.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ErrorNotice from "@/components/ui/ErrorNotice";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import PageHead from "@/components/ui/PageHead";
import { useToast } from "@/components/ui/ToastProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { ApiError, errorMessage } from "@/lib/http/apiClient";
import { openRazorpayCheckout } from "@/lib/payments/razorpayCheckout";
import { getSessionUser } from "@/lib/session/authSession";
import { createPaymentOrder, verifyPayment } from "@/services/paymentService";
import { PAYMENT_PURPOSES, type PaymentOrder, type PaymentPurpose, type RazorpayPaymentResult } from "@/types/payment";
import CheckoutMessage from "./CheckoutMessage";
import OrderReview, { type CheckoutNotice } from "./OrderReview";

const asPurpose = (value: string | null) => PAYMENT_PURPOSES.find((purpose) => purpose === value) ?? null;

/** Only an in-app path, so a crafted link cannot send someone to another site after paying. */
const safeReturnPath = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard");

async function loadOrder(purpose: PaymentPurpose | null, referenceId: string): Promise<PaymentOrder | null> {
  if (!purpose) return null;
  try {
    return await createPaymentOrder(purpose, referenceId);
  } catch (error) {
    if (error instanceof ApiError && error.isMissingEndpoint) return null;
    throw error;
  }
}

export default function CheckoutFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const purpose = asPurpose(params.get("purpose"));
  const referenceId = params.get("referenceId") ?? "";
  const returnTo = safeReturnPath(params.get("returnTo"));
  const isComplete = purpose !== null && referenceId !== "";

  const order = useApiResource(isComplete ? `payment-order-${purpose}-${referenceId}` : null, () => loadOrder(purpose, referenceId));
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<CheckoutNotice>(null);
  const [unconfirmed, setUnconfirmed] = useState<RazorpayPaymentResult | null>(null);
  const [paid, setPaid] = useState(false);

  const confirm = async (result: RazorpayPaymentResult) => {
    setBusyLabel("Confirming payment");
    setNotice(null);
    try {
      await verifyPayment(result);
      setUnconfirmed(null);
      setPaid(true);
      toast("Payment received.");
      router.replace(returnTo);
    } catch (error) {
      setUnconfirmed(result);
      setNotice({ tone: "error", text: errorMessage(error, "Your payment could not be confirmed yet. Please try again.") });
    } finally {
      setBusyLabel(null);
    }
  };

  const pay = async (current: PaymentOrder, themeColour: string) => {
    if (unconfirmed) return confirm(unconfirmed);
    setBusyLabel("Paying");
    setNotice(null);
    const user = getSessionUser();
    try {
      const outcome = await openRazorpayCheckout({
        orderId: current.orderId,
        amountPaise: current.amountPaise,
        currency: current.currency,
        keyId: current.razorpayKeyId,
        description: current.title,
        customerName: user?.fullName ?? "",
        customerMobile: user?.mobile ?? "",
        themeColour,
      });
      if (outcome.kind === "paid") return confirm(outcome.result);
      setNotice(outcome.failureMessage ? { tone: "error", text: outcome.failureMessage } : { tone: "calm", text: "Payment not completed. You can pay when you are ready." });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    }
    setBusyLabel(null);
  };

  const content = () => {
    if (!isComplete) return <CheckoutMessage title="Checkout" text="This payment link is incomplete." returnTo={returnTo} actionLabel="Go back" />;
    if (paid) return <CheckoutMessage title="Payment received" text="Your payment is confirmed." returnTo={returnTo} actionLabel="Continue" />;
    if (order.error) return <ErrorNotice message={order.error} onRetry={order.reload} />;
    if (order.loading) return <LoadingSkeleton />;
    if (!order.data) return <CheckoutMessage title="Checkout" text="Online payment is not available yet." returnTo={returnTo} actionLabel="Go back" />;
    const current = order.data;
    return (
      <OrderReview order={current} busyLabel={busyLabel} notice={notice} awaitingConfirmation={unconfirmed !== null} onPay={(themeColour) => pay(current, themeColour)} />
    );
  };

  return (
    <>
      <PageHead title="Checkout" back={{ href: returnTo, label: "Back" }} />
      {content()}
    </>
  );
}
