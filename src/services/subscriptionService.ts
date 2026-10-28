/**
 * Programme plans.
 *   GET  /api/subscriptions/plans                 -> { success, data: [{ PlanId, PlanName, DurationMonths, Price, IsActive, Perks }] }
 *   GET  /api/subscriptions/status?userId=        -> { hasActivePlan | isActive, planId }
 *   POST /api/subscriptions/activate              { targetUserId, planId }  (call only after payment is verified)
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

type RawPlan = { PlanId: number; PlanName: string; DurationMonths: number; Price: number | null; IsActive: boolean; Perks?: string[] };

export async function listPlans(): Promise<SubscriptionPlan[]> {
  const body = await apiRequest("/api/subscriptions/plans", { authenticated: false });
  return listFrom<RawPlan>(body).map((raw) => ({
    id: raw.PlanId,
    name: raw.PlanName,
    durationMonths: raw.DurationMonths,
    priceRupees: raw.Price,
    isActive: raw.IsActive,
    perks: raw.Perks ?? [],
  }));
}

export async function getSubscriptionStatus(userId: number): Promise<SubscriptionStatus> {
  const body = await apiRequest<{ hasActivePlan?: boolean; isActive?: boolean; planId?: number; data?: { hasActivePlan?: boolean; isActive?: boolean; planId?: number } }>(
    "/api/subscriptions/status",
    { query: { userId } },
  );
  const source = body.data ?? body;
  return { hasActivePlan: Boolean(source.hasActivePlan ?? source.isActive), planId: source.planId ?? null };
}

export async function activatePlan(userId: number, planId: number): Promise<void> {
  await apiRequest("/api/subscriptions/activate", { method: "POST", body: { targetUserId: userId, planId } });
}
