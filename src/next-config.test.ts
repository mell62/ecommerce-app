import { describe, expect, it } from "vitest";
import nextConfig, {
  buildContentSecurityPolicy,
  securityHeaders,
} from "../next.config";

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
        {
          key: "Content-Security-Policy",
          value: expect.stringContaining("default-src 'self'"),
        },
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

  it("allows only the production resources used by the storefront", () => {
    const policy = buildContentSecurityPolicy(
      "store.supabase.co",
      false
    );

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain(
      "img-src 'self' data: blob: https://images.unsplash.com https://store.supabase.co"
    );
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain("ws:");
  });

  it("permits the extra script and WebSocket behavior needed in development", () => {
    const policy = buildContentSecurityPolicy(undefined, true);

    expect(policy).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );
    expect(policy).toContain("connect-src 'self' ws: wss:");
    expect(policy).not.toContain("https://undefined");
  });
});
