// @vitest-environment node

import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/admin/products/[id]/archive/route";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const productUpdateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      update: productUpdateMock,
    },
  },
}));

const admin = {
  id: "admin-1",
  name: "Mycroft",
  email: "mycroft@example.com",
  role: "ADMIN",
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/products/product-1/archive", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

const context = {
  params: Promise.resolve({ id: "product-1" }),
};

describe("admin product archive API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: admin,
    });
    productUpdateMock.mockImplementation(
      ({ data }: { data: { isArchived: boolean } }) =>
        Promise.resolve({
          id: "product-1",
          name: "Gaming Mouse",
          isArchived: data.isArchived,
        })
    );
  });

  it("requires a signed-in administrator", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });

    const response = await PATCH(createRequest({ isArchived: true }), context);

    expect(response.status).toBe(401);
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: { ...admin, role: "USER" },
    });

    const response = await PATCH(createRequest({ isArchived: true }), context);

    expect(response.status).toBe(403);
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it("requires a boolean archive state", async () => {
    const response = await PATCH(
      createRequest({ isArchived: "true" }),
      context
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Choose whether the product should be archived.",
    });
    expect(productUpdateMock).not.toHaveBeenCalled();
  });

  it.each([
    { isArchived: true, action: "archived" },
    { isArchived: false, action: "restored" },
  ])("marks a product as $action", async ({ isArchived, action }) => {
    const response = await PATCH(createRequest({ isArchived }), context);

    expect(response.status).toBe(200);
    expect(productUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        isArchived,
      },
      select: {
        id: true,
        name: true,
        isArchived: true,
      },
    });
    expect(await response.json()).toEqual({
      message: `Gaming Mouse was ${action} successfully.`,
      product: {
        id: "product-1",
        name: "Gaming Mouse",
        isArchived,
      },
    });
  });

  it("returns not found for an unknown product", async () => {
    productUpdateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "test",
      })
    );

    const response = await PATCH(createRequest({ isArchived: true }), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Product not found." });
  });

  it("returns a retryable response when the database is unavailable", async () => {
    productUpdateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Database unavailable", {
        code: "P1001",
        clientVersion: "test",
      })
    );

    const response = await PATCH(createRequest({ isArchived: true }), context);

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({
      error: "The database is temporarily unavailable. Try again shortly.",
    });
  });
});
