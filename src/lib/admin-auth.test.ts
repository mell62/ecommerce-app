// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminAccess } from "@/lib/admin-auth";

const getCurrentUserMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: getCurrentUserMock,
}));

describe("admin authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies a request without a signed-in user", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    await expect(getAdminAccess()).resolves.toEqual({
      status: "unauthenticated",
    });
  });

  it("rejects a signed-in user without the admin role", async () => {
    const user = {
      id: "customer-1",
      name: "Alex",
      email: "alex@example.com",
      role: "USER",
    };
    getCurrentUserMock.mockResolvedValue(user);

    await expect(getAdminAccess()).resolves.toEqual({
      status: "forbidden",
      user,
    });
  });

  it("authorizes a signed-in user with the admin role", async () => {
    const user = {
      id: "admin-1",
      name: "Mycroft",
      email: "mycroft@example.com",
      role: "ADMIN",
    };
    getCurrentUserMock.mockResolvedValue(user);

    await expect(getAdminAccess()).resolves.toEqual({
      status: "authorized",
      user,
    });
  });
});
