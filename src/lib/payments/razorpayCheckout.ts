/**
 * Opens Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
 * for an order the backend already created, and resolves with what happened.
 *
 * The script loads once, on first use. Razorpay keeps its window open after a failed attempt so the
 * person can try another method; the failure is remembered and reported only if they then close it.
 * The key id comes from the order, falling back to NEXT_PUBLIC_RAZORPAY_KEY_ID. The secret never
 * reaches the browser.
 */

import { RAZORPAY_KEY_ID } from "@/config/env";
import type { RazorpayPaymentResult } from "@/types/payment";

const CHECKOUT_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name?: string; contact?: string };
  theme: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export type CheckoutRequest = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  description: string;
  customerName: string;
  customerMobile: string;
  /** A resolved colour value (read from a design token at runtime). */
  themeColour: string;
};

export type CheckoutOutcome =
  | { kind: "paid"; result: RazorpayPaymentResult }
  | { kind: "closed"; failureMessage: string | null };

let scriptLoading: Promise<RazorpayConstructor> | null = null;

function loadCheckoutScript(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  scriptLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("The payment window could not start. Please try again.")));
    script.onerror = () => {
      scriptLoading = null;
      script.remove();
      reject(new Error("The payment window could not load. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

export async function openRazorpayCheckout(request: CheckoutRequest): Promise<CheckoutOutcome> {
  const key = request.keyId || RAZORPAY_KEY_ID;
  if (!key) throw new Error("Online payment is not set up yet.");
  const Razorpay = await loadCheckoutScript();

  return new Promise((resolve) => {
    let failureMessage: string | null = null;
    const checkout = new Razorpay({
      key,
      amount: request.amountPaise,
      currency: request.currency,
      order_id: request.orderId,
      name: "Medistry",
      description: request.description,
      prefill: { name: request.customerName || undefined, contact: request.customerMobile || undefined },
      theme: { color: request.themeColour || undefined },
      handler: (response) =>
        resolve({
          kind: "paid",
          result: { orderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature },
        }),
      modal: { ondismiss: () => resolve({ kind: "closed", failureMessage }) },
    });
    checkout.on("payment.failed", (response) => {
      failureMessage = response.error?.description || "The payment did not go through.";
    });
    checkout.open();
  });
}
