// @vitest-environment node

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const apiDirectory = join(process.cwd(), "src", "app", "api");
const mutationHandlerPattern =
  /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/;
const signatureProtectedRoutes = new Map([
  [
    "stripe/webhook/route.ts",
    ["stripe-signature", "webhooks.constructEvent"],
  ],
]);

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return findRouteFiles(entryPath);
    }

    return entry.name === "route.ts" ? [entryPath] : [];
  });
}

describe("API CSRF rules", () => {
  it("protects every mutation route with an origin or signature check", () => {
    const mutationRoutes = findRouteFiles(apiDirectory)
      .map((filePath) => ({
        filePath,
        relativePath: relative(apiDirectory, filePath).replaceAll("\\", "/"),
        source: readFileSync(filePath, "utf8"),
      }))
      .filter(({ source }) => mutationHandlerPattern.test(source));

    expect(mutationRoutes.length).toBeGreaterThan(0);

    for (const route of mutationRoutes) {
      const signatureMarkers = signatureProtectedRoutes.get(route.relativePath);

      if (signatureMarkers) {
        for (const marker of signatureMarkers) {
          expect(route.source, route.relativePath).toContain(marker);
        }

        continue;
      }

      expect(route.source, route.relativePath).toContain(
        "isSameOriginRequest(request)"
      );
    }
  });
});
