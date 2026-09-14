// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";

const hashMock = vi.hoisted(() => vi.fn());
const findUniqueMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());
const createSessionMock = vi.hoisted(() => vi.fn());

vi.mock("argon2", () => ({
  default: {
    hash: hashMock,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
}));

vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
}));

const createdUser = {
  id: "customer-1",
  name: "Watson",
  email: "watson@example.com",
  role: "USER",
  createdAt: new Date("2026-09-14T10:00:00.000Z"),
};

function createRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
      "x-real-ip": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("registration API rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimitMock.mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      resetAt: new Date("2026-09-14T11:00:00.000Z"),
      retryAfterSeconds: 0,
    });
    findUniqueMock.mockResolvedValue(null);
    hashMock.mockResolvedValue("stored-password-hash");
    createMock.mockResolvedValue(createdUser);
  });

  it("rejects a cross-site request before consuming a rate limit", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://attacker.example",
        },
        body: JSON.stringify({
          name: "Watson",
          email: "watson@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("limits valid registration attempts by client address", async () => {
    const response = await POST(
      createRequest({
        name: "Watson",
        email: "watson@example.com",
        password: "password123",
      })
    );

    expect(response.status).toBe(201);
    expect(consumeRateLimitMock).toHaveBeenCalledWith({
      namespace: "auth:register",
      identifier: "203.0.113.10",
      limit: 10,
      windowMs: 3_600_000,
    });
    expect(hashMock).toHaveBeenCalledWith("password123");
    expect(createSessionMock).toHaveBeenCalledWith(createdUser);
  });

  it("returns 429 without querying or hashing when registration is blocked", async () => {
    consumeRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: new Date("2026-09-14T10:45:00.000Z"),
      retryAfterSeconds: 2700,
    });

    const response = await POST(
      createRequest({
        name: "Watson",
        email: "watson@example.com",
        password: "password123",
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2700");
    await expect(response.json()).resolves.toEqual({
      error: "Too many accounts created. Try again later.",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(hashMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("does not consume a bucket for invalid registration details", async () => {
    const response = await POST(
      createRequest({
        name: "Watson",
        email: "watson@example.com",
        password: "short",
      })
    );

    expect(response.status).toBe(400);
    expect(consumeRateLimitMock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON before hashing or using the database", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/register", {
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
    expect(hashMock).not.toHaveBeenCalled();
  });
});
