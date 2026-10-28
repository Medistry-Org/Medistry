/** A medicine delivery's steps and its status in a few words, shared by the programme card and the delivery sheet. */

import { shortDate } from "@/lib/format/dateTime";
import type { MedicineOrder, MedicineOrderStatus } from "@/types/carePlan";

export const DELIVERY_STEPS = ["Ordered", "Packed", "On the way", "Delivered"];

const STEP_INDEX: Record<MedicineOrderStatus, number> = {
  PLACED: 0,
  PACKED: 1,
  DISPATCHED: 2,
  DELIVERED: 3,
};

/** The step happening now; past the last one once delivered. */
export const deliveryStepIndex = (order: MedicineOrder) =>
  STEP_INDEX[order.status] + (order.status === "DELIVERED" ? 1 : 0);

/** When a status was reached, if it has been. */
export const reachedAt = (order: MedicineOrder, status: MedicineOrderStatus) =>
  order.history.find((entry) => entry.status === status)?.at ?? null;

/** "On the way, due 6 Oct", "Delivered 16 Sep", "Packed 2 Oct" */
export function deliveryLine(order: MedicineOrder) {
  const at = reachedAt(order, order.status) ?? order.placedAt;
  if (order.status === "DELIVERED") return `Delivered ${shortDate(at)}`;
  if (order.status === "DISPATCHED")
    return order.expectedAt
      ? `On the way, due ${shortDate(order.expectedAt)}`
      : `On the way since ${shortDate(at)}`;
  return `${order.status === "PACKED" ? "Packed" : "Ordered"} ${shortDate(at)}`;
}
