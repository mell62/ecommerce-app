import { describe, expect, it } from "vitest";
import { getApplicationOrigin } from "@/lib/application-origin";

describe("application origin", () => {
  it("uses the configured HTTPS origin instead of the request host", () => {
    expect(
      getApplicationOrigin("https://attacker.example/api/checkout/session", {
        NODE_ENV: "production",
        NEXT_PUBLIC_BASE_URL: "https://shop.zeus.example/storefront",
      })
    ).toBe("https://shop.zeus.example");
  });

  it("allows a localhost fallback outside production", () => {
    expect(
      getApplicationOrigin("http://localhost:3000/api/checkout/session", {
        NODE_ENV: "development",
      })
    ).toBe("http://localhost:3000");
  });

  it("requires a configured URL in production", () => {
    expect(() =>
      getApplicationOrigin("https://request.example/api/checkout/session", {
        NODE_ENV: "production",
      })
    ).toThrow("NEXT_PUBLIC_BASE_URL is required");
  });

  it.each([
    "http://shop.zeus.example",
    "https://username:password@shop.zeus.example",
  ])("rejects an unsafe configured URL: %s", (configuredUrl) => {
    expect(() =>
      getApplicationOrigin("http://localhost:3000/api/checkout/session", {
        NODE_ENV: "production",
        NEXT_PUBLIC_BASE_URL: configuredUrl,
      })
    ).toThrow();
  });
});
