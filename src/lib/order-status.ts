export const ORDER_FULFILLMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderFulfillmentStatus =
  (typeof ORDER_FULFILLMENT_STATUSES)[number];

const allowedNextStatuses: Readonly<
  Record<OrderFulfillmentStatus, readonly OrderFulfillmentStatus[]>
> = {
  PENDING: [],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isOrderFulfillmentStatus(
  value: unknown
): value is OrderFulfillmentStatus {
  return (
    typeof value === "string" &&
    ORDER_FULFILLMENT_STATUSES.some((status) => status === value)
  );
}

export function getAllowedNextOrderStatuses(
  currentStatus: string
): readonly OrderFulfillmentStatus[] {
  if (!isOrderFulfillmentStatus(currentStatus)) {
    return [];
  }

  return allowedNextStatuses[currentStatus];
}

export function canTransitionOrderStatus(
  currentStatus: string,
  nextStatus: OrderFulfillmentStatus
): boolean {
  return getAllowedNextOrderStatuses(currentStatus).includes(nextStatus);
}
