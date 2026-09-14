import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeRateLimit,
  createRateLimitKey,
} from "@/lib/rate-limit";

const queryRawMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

describe("database rate limiting", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    vi.stubEnv("RATE_LIMIT_SECRET", "test-rate-limit-secret");
  });

  it("creates a stable key without storing the raw identifier", () => {
    const firstKey = createRateLimitKey("login", "customer@example.com");
    const secondKey = createRateLimitKey("login", "customer@example.com");

    expect(firstKey).toBe(secondKey);
    expect(firstKey).toMatch(/^login:[a-f0-9]{64}$/);
    expect(firstKey).not.toContain("customer@example.com");
  });

  it("allows requests within the limit and reports remaining attempts", async () => {
    const now = new Date("2026-09-14T10:00:00.000Z");
    const resetAt = new Date("2026-09-14T10:01:00.000Z");
    queryRawMock.mockResolvedValue([{ attempts: 2, expiresAt: resetAt }]);

    const result = await consumeRateLimit({
      namespace: "login",
      identifier: "customer@example.com",
      limit: 5,
      windowMs: 60_000,
      now,
    });

    expect(result).toEqual({
      allowed: true,
      limit: 5,
      remaining: 3,
      resetAt,
      retryAfterSeconds: 0,
    });
    expect(queryRawMock).toHaveBeenCalledOnce();
  });

  it("blocks requests over the limit and returns rounded retry timing", async () => {
    const now = new Date("2026-09-14T10:00:00.250Z");
    const resetAt = new Date("2026-09-14T10:00:31.000Z");
    queryRawMock.mockResolvedValue([{ attempts: 6, expiresAt: resetAt }]);

    const result = await consumeRateLimit({
      namespace: "login",
      identifier: "customer@example.com",
      limit: 5,
      windowMs: 60_000,
      now,
    });

    expect(result).toEqual({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetAt,
      retryAfterSeconds: 31,
    });
  });

  it.each([
    { limit: 0, windowMs: 60_000, message: "positive integer" },
    { limit: 5, windowMs: 0, message: "window" },
  ])("rejects invalid limits and windows", async ({ limit, windowMs, message }) => {
    await expect(
      consumeRateLimit({
        namespace: "login",
        identifier: "customer@example.com",
        limit,
        windowMs,
      })
    ).rejects.toThrow(message);

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("requires a secret before hashing identifiers", () => {
    vi.stubEnv("RATE_LIMIT_SECRET", "");
    vi.stubEnv("SESSION_SECRET", "");

    expect(() => createRateLimitKey("login", "customer@example.com")).toThrow(
      "must be configured"
    );
  });
});
