/** A plan from GET /api/subscriptions/plans. Price is in rupees. */
export type SubscriptionPlan = {
  id: number;
  name: string;
  durationMonths: number;
  priceRupees: number | null;
  isActive: boolean;
  perks: string[];
};

export type SubscriptionStatus = {
  hasActivePlan: boolean;
  planId: number | null;
};
