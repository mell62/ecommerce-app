import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as getCurrentAccount } from "@/app/api/auth/me/route";
import { POST as register } from "@/app/api/auth/register/route";
import CheckoutPage from "@/app/checkout/page";
import OrdersPage from "@/app/orders/page";

const passwordHashMock = vi.hoisted(() => vi.fn());
const passwordVerifyMock = vi.hoisted(() => vi.fn());
const userCreateMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());
const createSessionMock = vi.hoisted(() => vi.fn());
const deleteSessionMock = vi.hoisted(() => vi.fn());
const getCurrentUserMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("argon2", () => ({
  default: {
    hash: passwordHashMock,
    verify: passwordVerifyMock,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    user: {
      create: userCreateMock,
      findUnique: userFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
  deleteSession: deleteSessionMock,
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const storedUser = {
  id: "customer-1",
  name: "Alex",
  email: "alex@example.com",
  password: "stored-password-hash",
  role: "CUSTOMER",
  createdAt: new Date("2026-08-01T12:00:00.000Z"),
};

function createRequest(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("authentication rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    passwordHashMock.mockResolvedValue("new-password-hash");
    passwordVerifyMock.mockResolvedValue(true);
    createSessionMock.mockResolvedValue(undefined);
    deleteSessionMock.mockResolvedValue(undefined);
    getCurrentUserMock.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("normalizes login email and returns no password", async () => {
    userFindUniqueMock.mockResolvedValue(storedUser);

    const response = await login(
      createRequest("/api/auth/login", {
        email: "  ALEX@EXAMPLE.COM  ",
        password: "correct-password",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: {
        email: "alex@example.com",
      },
    });
    expect(passwordVerifyMock).toHaveBeenCalledWith(
      storedUser.password,
      "correct-password"
    );
    expect(createSessionMock).toHaveBeenCalledWith(storedUser);
    expect(body).not.toHaveProperty("password");
  });

  it("does not create a session for an invalid password", async () => {
    userFindUniqueMock.mockResolvedValue(storedUser);
    passwordVerifyMock.mockResolvedValue(false);

    const response = await login(
      createRequest("/api/auth/login", {
        email: storedUser.email,
        password: "wrong-password",
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Invalid email or password.",
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("rejects registration passwords shorter than eight characters", async () => {
    const response = await register(
      createRequest("/api/auth/register", {
        name: "Alex",
        email: "alex@example.com",
        password: "short",
      })
    );

    expect(response.status).toBe(400);
    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(passwordHashMock).not.toHaveBeenCalled();
  });

  it("rejects an existing normalized registration email", async () => {
    userFindUniqueMock.mockResolvedValue(storedUser);

    const response = await register(
      createRequest("/api/auth/register", {
        name: "Alex",
        email: "  ALEX@EXAMPLE.COM  ",
        password: "password123",
      })
    );

    expect(response.status).toBe(409);
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: {
        email: "alex@example.com",
      },
    });
    expect(userCreateMock).not.toHaveBeenCalled();
  });

  it("hashes a valid password and starts a session", async () => {
    const createdUser = {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      role: storedUser.role,
      createdAt: storedUser.createdAt,
    };
    userFindUniqueMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue(createdUser);

    const response = await register(
      createRequest("/api/auth/register", {
        name: "  Alex  ",
        email: "  ALEX@EXAMPLE.COM  ",
        password: "password123",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(passwordHashMock).toHaveBeenCalledWith("password123");
    expect(userCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Alex",
        email: "alex@example.com",
        password: "new-password-hash",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    expect(createSessionMock).toHaveBeenCalledWith(createdUser);
    expect(body).not.toHaveProperty("password");
  });

  it("returns the current account without exposing session internals", async () => {
    const currentUser = {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      role: storedUser.role,
    };
    getCurrentUserMock.mockResolvedValue(currentUser);

    const response = await getCurrentAccount();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: currentUser });
  });

  it("deletes the server session during logout", async () => {
    const response = await logout();

    expect(response.status).toBe(200);
    expect(deleteSessionMock).toHaveBeenCalledOnce();
  });

  it.each([
    ["checkout", () => CheckoutPage()],
    ["orders", () => OrdersPage({ searchParams: Promise.resolve({}) })],
  ])("redirects logged-out customers away from %s", async (_page, loadPage) => {
    await expect(loadPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
