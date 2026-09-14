import { describe, expect, it } from "vitest";
import { getSafeInternalRedirect } from "@/lib/safe-redirect";

describe("safe internal redirects", () => {
  it.each([
    "/cart",
    "/products/product-1?from=wishlist",
    "/products/product-1#reviews",
  ])("preserves the internal destination %s", (destination) => {
    expect(getSafeInternalRedirect(destination)).toBe(destination);
  });

  it.each([
    null,
    undefined,
    "",
    "products",
    "https://malicious.example",
    "//malicious.example",
    "/\\malicious.example",
    "/%5C%5Cmalicious.example",
    "/%2F%2Fmalicious.example",
    "/%not-valid",
  ])("uses the fallback for unsafe destination %s", (destination) => {
    expect(getSafeInternalRedirect(destination)).toBe("/");
  });

  it("supports a caller-provided fallback", () => {
    expect(getSafeInternalRedirect("https://malicious.example", "/login")).toBe(
      "/login"
    );
  });
});
