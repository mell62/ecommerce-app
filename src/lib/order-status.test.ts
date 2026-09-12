import { describe, expect, it } from "vitest";
import {
  canTransitionOrderStatus,
  getAllowedNextOrderStatuses,
  isOrderFulfillmentStatus,
} from "@/lib/order-status";

describe("order fulfillment transitions", () => {
  it("allows only the next forward fulfillment step", () => {
    expect(getAllowedNextOrderStatuses("PROCESSING")).toEqual(["SHIPPED"]);
    expect(getAllowedNextOrderStatuses("SHIPPED")).toEqual(["DELIVERED"]);
    expect(canTransitionOrderStatus("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransitionOrderStatus("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("does not advance unpaid or terminal orders", () => {
    expect(getAllowedNextOrderStatuses("PENDING")).toEqual([]);
    expect(getAllowedNextOrderStatuses("DELIVERED")).toEqual([]);
    expect(getAllowedNextOrderStatuses("CANCELLED")).toEqual([]);
  });

  it("rejects skipped, backward, and unknown transitions", () => {
    expect(canTransitionOrderStatus("PROCESSING", "DELIVERED")).toBe(false);
    expect(canTransitionOrderStatus("SHIPPED", "PROCESSING")).toBe(false);
    expect(getAllowedNextOrderStatuses("UNKNOWN")).toEqual([]);
    expect(isOrderFulfillmentStatus("READY_FOR_PICKUP")).toBe(false);
  });
});
