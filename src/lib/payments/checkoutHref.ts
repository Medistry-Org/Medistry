/** The link to the shared checkout (/patient-dashboard/checkout); it asks the backend for the price and goes to returnTo once paid. */

import type { PaymentPurpose } from "@/types/payment";

export function checkoutHref({
  purpose,
  referenceId,
  returnTo,
}: {
  purpose: PaymentPurpose;
  referenceId: string | number;
  returnTo: string;
}): string {
  const query = new URLSearchParams({
    purpose,
    referenceId: String(referenceId),
    returnTo,
  });
  return `/patient-dashboard/checkout?${query}`;
}
