import { Prisma } from "@prisma/client";

export type DatabaseErrorDetails = Readonly<{
  status: 409 | 503;
  message: string;
  retryAfterSeconds?: number;
}>;

const temporarilyUnavailableCodes = new Set(["P1001", "P1002", "P2024"]);

export function getDatabaseErrorDetails(
  error: unknown
): DatabaseErrorDetails | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (temporarilyUnavailableCodes.has(error.code)) {
    return {
      status: 503,
      message: "The database is temporarily unavailable. Try again shortly.",
      retryAfterSeconds: 5,
    };
  }

  if (error.code === "P2034") {
    return {
      status: 409,
      message:
        "The request conflicted with another update. Refresh and try again.",
    };
  }

  return null;
}
