// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";

const verifyMock = vi.hoisted(() => vi.fn());
const findUniqueMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());
const createSessionMock = vi.hoisted(() => vi.fn());

vi.mock("argon2", () => ({
  default: {
    verify: verifyMock,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
}));

vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
}));

const user = {
  id: "customer-1",
  name: "Watson",
  email: "watson@example.com",
  password: "stored-password-hash",
  role: "USER",
};

function createRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("login API rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitMock.mockResolvedValue({
      allowed: true,
      limit: 5,
      remaining: 4,
      resetAt: new Date("2026-09-14T10:05:00.000Z"),
      retryAfterSeconds: 0,
    });
    findUniqueMock.mockResolvedValue(user);
    verifyMock.mockResolvedValue(true);
  });

  it("rejects a cross-site request before consuming a rate limit", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          email: "watson@example.com",
          password: "correct-password",
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("limits the client and normalized account before checking credentials", async () => {
    const response = await POST(
      createRequest({
        email: "  WATSON@EXAMPLE.COM ",
        password: "correct-password",
      })
    );

    expect(response.status).toBe(200);
    expect(consumeRateLimitMock).toHaveBeenNthCalledWith(1, {
      namespace: "auth:login:client",
      identifier: "203.0.113.10",
      limit: 20,
      windowMs: 300_000,
    });
    expect(consumeRateLimitMock).toHaveBeenNthCalledWith(2, {
      namespace: "auth:login:account",
      identifier: "203.0.113.10:watson@example.com",
      limit: 5,
      windowMs: 300_000,
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "watson@example.com" },
    });
    expect(verifyMock).toHaveBeenCalledWith(
      user.password,
      "correct-password"
    );
    expect(createSessionMock).toHaveBeenCalledWith(user);
  });

  it("blocks a client that exceeds the broader login limit", async () => {
    consumeRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 20,
      remaining: 0,
      resetAt: new Date("2026-09-14T10:02:15.000Z"),
      retryAfterSeconds: 135,
    });

    const response = await POST(
      createRequest({
        email: "watson@example.com",
        password: "attempt-six",
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("135");
    await expect(response.json()).resolves.toEqual({
      error: "Too many login attempts. Try again later.",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("blocks repeated attempts for one account from the same client", async () => {
    consumeRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        limit: 20,
        remaining: 14,
        resetAt: new Date("2026-09-14T10:05:00.000Z"),
        retryAfterSeconds: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        limit: 5,
        remaining: 0,
        resetAt: new Date("2026-09-14T10:03:00.000Z"),
        retryAfterSeconds: 180,
      });

    const response = await POST(
      createRequest({
        email: "watson@example.com",
        password: "attempt-six",
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("180");
    expect(consumeRateLimitMock).toHaveBeenCalledTimes(2);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("does not consume a bucket for an incomplete request", async () => {
    const response = await POST(
      createRequest({ email: "watson@example.com", password: "" })
    );

    expect(response.status).toBe(400);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns a client error for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost",
        },
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("keeps the credential error generic when authentication fails", async () => {
    verifyMock.mockResolvedValue(false);

    const response = await POST(
      createRequest({
        email: "watson@example.com",
        password: "wrong-password",
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid email or password.",
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });
});
