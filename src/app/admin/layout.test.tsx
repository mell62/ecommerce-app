import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/app/admin/layout";

const getAdminAccessMock = vi.hoisted(() => vi.fn());
const notFoundMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin-auth", () => ({
  getAdminAccess: getAdminAccessMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

describe("admin layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a logged-out visitor to login with an admin return path", async () => {
    getAdminAccessMock.mockResolvedValue({ status: "unauthenticated" });
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      AdminLayout({ children: <p>Protected content</p> })
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login?redirect=/admin");
  });

  it("hides the admin area from a signed-in non-admin user", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "forbidden",
      user: {
        id: "customer-1",
        name: "Alex",
        email: "alex@example.com",
        role: "USER",
      },
    });
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      AdminLayout({ children: <p>Protected content</p> })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("renders protected content for an administrator", async () => {
    getAdminAccessMock.mockResolvedValue({
      status: "authorized",
      user: {
        id: "admin-1",
        name: "Mycroft",
        email: "mycroft@example.com",
        role: "ADMIN",
      },
    });

    const children = <p>Protected content</p>;

    await expect(AdminLayout({ children })).resolves.toBe(children);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
