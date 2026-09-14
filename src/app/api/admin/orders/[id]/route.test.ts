// @vitest-environment node

import { PaymentStatus, Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/orders/[id]/route";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const orderFindUniqueMock = vi.hoisted(() => vi.fn());
const orderUpdateManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findUnique: orderFindUniqueMock,
      updateMany: orderUpdateManyMock,
    },
  },
}));

const admin = {
  id: "admin-1",
  name: "Mycroft",
  email: "mycroft@example.com",
  role: "ADMIN",
};

const paidProcessingOrder = {
  id: "order-1",
  status: "PROCESSING",
  paymentStatus: PaymentStatus.PAID,
};

function createRequest(
  body: unknown,
  origin = "http://localhost"
): Request {
  return new Request("http://localhost/api/admin/orders/order-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

const context = {
  params: Promise.resolve({ id: "order-1" }),
};

describe("admin order status API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
    orderFindUniqueMock.mockResolvedValue(paidProcessingOrder);
    orderUpdateManyMock.mockResolvedValue({ count: 1 });
  });

  it("rejects cross-site updates before checking admin access", async () => {
    const response = await PATCH(
      createRequest({ status: "SHIPPED" }, "https://malicious.example"),
      context
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Cross-site requests are not allowed.",
    });
    expect(getAdminAccessMock).not.toHaveBeenCalled();
    expect(orderFindUniqueMock).not.toHaveBeenCalled();
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(401);
    expect(orderFindUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(403);
    expect(orderFindUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects malformed or unknown statuses", async () => {
    const response = await PATCH(
      createRequest({ status: "READY_FOR_PICKUP" }),
      context
    );

    expect(response.status).toBe(400);
    expect(orderFindUniqueMock).not.toHaveBeenCalled();
  });

  it("returns not found for an unknown order", async () => {
    orderFindUniqueMock.mockResolvedValue(null);

    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(404);
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("does not advance an unpaid order", async () => {
    orderFindUniqueMock.mockResolvedValue({
      ...paidProcessingOrder,
      status: "PENDING",
      paymentStatus: PaymentStatus.PENDING,
    });

    const response = await PATCH(
      createRequest({ status: "PROCESSING" }),
      context
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Only paid orders can advance through fulfillment.",
    });
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("rejects skipped and backward fulfillment transitions", async () => {
    const response = await PATCH(
      createRequest({ status: "DELIVERED" }),
      context
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "An order cannot move from PROCESSING to DELIVERED.",
    });
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("treats a request for the current status as idempotent", async () => {
    const response = await PATCH(
      createRequest({ status: "PROCESSING" }),
      context
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      order: paidProcessingOrder,
    });
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });

  it("advances a paid order using a concurrent-state condition", async () => {
    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(200);
    expect(orderUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        status: "PROCESSING",
        paymentStatus: PaymentStatus.PAID,
      },
      data: {
        status: "SHIPPED",
      },
    });
    expect(await response.json()).toEqual({
      order: {
        ...paidProcessingOrder,
        status: "SHIPPED",
      },
    });
  });

  it("returns a conflict when the order changes concurrently", async () => {
    orderUpdateManyMock.mockResolvedValue({ count: 0 });

    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error:
        "The order changed while it was being updated. Refresh and try again.",
    });
  });

  it("returns a retryable response when the database is unavailable", async () => {
    orderFindUniqueMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1002",
        clientVersion: "test",
      })
    );

    const response = await PATCH(createRequest({ status: "SHIPPED" }), context);

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({
      error: "The database is temporarily unavailable. Try again shortly.",
    });
    expect(orderUpdateManyMock).not.toHaveBeenCalled();
  });
});
