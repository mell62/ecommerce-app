// @vitest-environment node

import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getDatabaseErrorDetails } from "@/lib/database-error";

function createPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Database error", {
    code,
    clientVersion: "test",
  });
}

describe("getDatabaseErrorDetails", () => {
  it.each(["P1001", "P1002", "P2024"])(
    "classifies %s as temporarily unavailable",
    (code) => {
      expect(getDatabaseErrorDetails(createPrismaError(code))).toEqual({
        status: 503,
        message: "The database is temporarily unavailable. Try again shortly.",
        retryAfterSeconds: 5,
      });
    }
  );

  it("classifies a write conflict as a retryable conflict", () => {
    expect(getDatabaseErrorDetails(createPrismaError("P2034"))).toEqual({
      status: 409,
      message:
        "The request conflicted with another update. Refresh and try again.",
    });
  });

  it("does not misclassify unrelated errors", () => {
    expect(getDatabaseErrorDetails(new Error("Unexpected failure"))).toBeNull();
    expect(getDatabaseErrorDetails(createPrismaError("P2002"))).toBeNull();
  });
});
