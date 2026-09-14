import { describe, expect, it } from "vitest";
import nextConfig, { securityHeaders } from "../next.config";

describe("Next.js security headers", () => {
  it("applies the baseline browser protections to every route", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");

    const routes = await nextConfig.headers?.();

    expect(routes).toEqual([
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]);
    expect(securityHeaders).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ])
    );
  });
});
