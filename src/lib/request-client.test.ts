import { describe, expect, it } from "vitest";
import { getClientAddress } from "@/lib/request-client";

function createRequest(headers?: HeadersInit): Request {
  return new Request("http://localhost/api/example", { headers });
}

describe("request client address", () => {
  it("prefers the proxy-provided real IP address", () => {
    const request = createRequest({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1, 198.51.100.2",
    });

    expect(getClientAddress(request)).toBe("203.0.113.10");
  });

  it("uses the first forwarded address when a real IP is unavailable", () => {
    const request = createRequest({
      "x-forwarded-for": "198.51.100.1, 198.51.100.2",
    });

    expect(getClientAddress(request)).toBe("198.51.100.1");
  });

  it("uses a stable fallback when proxy headers are unavailable", () => {
    expect(getClientAddress(createRequest())).toBe("unknown-client");
  });

  it("uses Vercel's protected forwarding header in production", () => {
    const request = createRequest({
      "x-vercel-forwarded-for": "192.0.2.50",
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });

    expect(getClientAddress(request, { VERCEL: "1" })).toBe("192.0.2.50");
  });

  it("does not trust fallback forwarding headers in the Vercel runtime", () => {
    const request = createRequest({
      "x-vercel-forwarded-for": "not-an-ip-address",
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "198.51.100.1",
    });

    expect(getClientAddress(request, { VERCEL: "1" })).toBe(
      "unknown-client"
    );
  });

  it("accepts valid IPv6 addresses and rejects malformed addresses", () => {
    expect(
      getClientAddress(
        createRequest({ "x-real-ip": "2001:db8::1" }),
        {}
      )
    ).toBe("2001:db8::1");
    expect(
      getClientAddress(
        createRequest({ "x-real-ip": "chosen-by-attacker" }),
        {}
      )
    ).toBe("unknown-client");
  });
});
