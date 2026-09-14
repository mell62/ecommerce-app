import "server-only";

import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type RateLimitOptions = Readonly<{
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
  now?: Date;
}>;

export type RateLimitResult = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}>;

type RateLimitRow = Readonly<{
  attempts: number;
  expiresAt: Date;
}>;

function getRateLimitSecret(): string {
  const secret =
    process.env.RATE_LIMIT_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "RATE_LIMIT_SECRET or SESSION_SECRET must be configured for rate limiting."
    );
  }

  return secret;
}

export function createRateLimitKey(
  namespace: string,
  identifier: string
): string {
  const normalizedNamespace = namespace.trim();
  const normalizedIdentifier = identifier.trim();

  if (!normalizedNamespace || !normalizedIdentifier) {
    throw new Error("Rate limit namespace and identifier are required.");
  }

  const identifierHash = createHmac("sha256", getRateLimitSecret())
    .update(normalizedIdentifier)
    .digest("hex");

  return `${normalizedNamespace}:${identifierHash}`;
}

function validateRateLimitOptions(limit: number, windowMs: number): void {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Rate limit must be a positive integer.");
  }

  if (!Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error("Rate limit window must be a positive integer.");
  }
}

export async function consumeRateLimit({
  namespace,
  identifier,
  limit,
  windowMs,
  now = new Date(),
}: RateLimitOptions): Promise<RateLimitResult> {
  validateRateLimitOptions(limit, windowMs);

  const key = createRateLimitKey(namespace, identifier);
  const expiresAt = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<RateLimitRow[]>(Prisma.sql`
    WITH "expiredBuckets" AS (
      SELECT "key"
      FROM "RateLimitBucket"
      WHERE "expiresAt" <= ${now}
        AND "key" <> ${key}
      ORDER BY "expiresAt" ASC
      LIMIT 100
    ),
    "deletedBuckets" AS (
      DELETE FROM "RateLimitBucket"
      WHERE "key" IN (SELECT "key" FROM "expiredBuckets")
    )
    INSERT INTO "RateLimitBucket" (
      "key",
      "attempts",
      "windowStart",
      "expiresAt",
      "updatedAt"
    )
    VALUES (${key}, 1, ${now}, ${expiresAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= EXCLUDED."windowStart" THEN 1
        ELSE "RateLimitBucket"."attempts" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= EXCLUDED."windowStart"
          THEN EXCLUDED."windowStart"
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= EXCLUDED."windowStart"
          THEN EXCLUDED."expiresAt"
        ELSE "RateLimitBucket"."expiresAt"
      END,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING "attempts", "expiresAt"
  `);
  const bucket = rows[0];

  if (!bucket) {
    throw new Error("The rate limit counter did not return a result.");
  }

  const allowed = bucket.attempts <= limit;

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - bucket.attempts),
    resetAt: bucket.expiresAt,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(
          1,
          Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)
        ),
  };
}
