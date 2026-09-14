import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/request-origin";

function createRequest(origin?: string): Request {
  return new Request("https://zeus.example/api/auth/login", {
    method: "POST",
    headers: origin ? { Origin: origin } : undefined,
  });
}

describe("same-origin request validation", () => {
  it("accepts an exact origin match", () => {
    expect(isSameOriginRequest(createRequest("https://zeus.example"))).toBe(
      true
    );
  });

  it.each([
    undefined,
    "null",
    "not-a-url",
    "https://attacker.example",
    "http://zeus.example",
    "https://zeus.example:444",
  ])("rejects a missing, malformed, or different origin: %s", (origin) => {
    expect(isSameOriginRequest(createRequest(origin))).toBe(false);
  });
});
