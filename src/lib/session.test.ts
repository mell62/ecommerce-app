// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import {
  createSession,
  deleteSession,
  getCurrentUser,
  getSession,
} from "@/lib/session";

const cookieGetMock = vi.hoisted(() => vi.fn());
const cookieSetMock = vi.hoisted(() => vi.fn());
const cookieDeleteMock = vi.hoisted(() => vi.fn());
const userFindUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: cookieGetMock,
      set: cookieSetMock,
      delete: cookieDeleteMock,
    }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
    },
  },
}));

const originalSessionSecret = process.env.SESSION_SECRET;
const testSessionSecret = "test-session-secret-at-least-32-characters";

async function createAndReadToken(): Promise<string> {
  await createSession({
    id: "customer-1",
  });

  return cookieSetMock.mock.calls[0][1] as string;
}

describe("session cookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = testSessionSecret;
  });

  afterEach(() => {
    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }
  });

  it("creates a signed HTTP-only session cookie that can be verified", async () => {
    const token = await createAndReadToken();

    expect(cookieSetMock).toHaveBeenCalledWith(
      "session",
      token,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );

    cookieGetMock.mockReturnValue({ value: token });

    await expect(getSession()).resolves.toEqual(
      expect.objectContaining({
        userId: "customer-1",
        iss: "zeus",
        aud: "zeus-web",
        sub: "customer-1",
      })
    );
  });

  it("rejects a signing secret shorter than 32 characters", async () => {
    process.env.SESSION_SECRET = "too-short";

    await expect(
      createSession({ id: "customer-1" })
    ).rejects.toThrow("SESSION_SECRET must be at least 32 characters long.");
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it("rejects a token whose signature has been changed", async () => {
    const token = await createAndReadToken();
    const finalCharacter = token.endsWith("a") ? "b" : "a";
    cookieGetMock.mockReturnValue({
      value: `${token.slice(0, -1)}${finalCharacter}`,
    });

    await expect(getSession()).resolves.toBeNull();
  });

  it("rejects a valid signature issued for another application", async () => {
    const token = await new SignJWT({ userId: "customer-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("another-store")
      .setAudience("zeus-web")
      .setSubject("customer-1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(testSessionSecret));
    cookieGetMock.mockReturnValue({ value: token });

    await expect(getSession()).resolves.toBeNull();
  });

  it("rejects a signed payload whose subject does not match its user ID", async () => {
    const token = await new SignJWT({ userId: "customer-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("zeus")
      .setAudience("zeus-web")
      .setSubject("customer-2")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(testSessionSecret));
    cookieGetMock.mockReturnValue({ value: token });

    await expect(getSession()).resolves.toBeNull();
  });

  it("loads only safe current-user fields from the signed user identifier", async () => {
    const token = await createAndReadToken();
    const currentUser = {
      id: "customer-1",
      name: "Alex",
      email: "alex@example.com",
      role: "USER",
    };
    cookieGetMock.mockReturnValue({ value: token });
    userFindUniqueMock.mockResolvedValue(currentUser);

    await expect(getCurrentUser()).resolves.toEqual(currentUser);
    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: {
        id: "customer-1",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  });

  it("deletes the session cookie during logout", async () => {
    await deleteSession();

    expect(cookieDeleteMock).toHaveBeenCalledWith("session");
  });
});
