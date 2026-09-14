// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

const deleteSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/session", () => ({
  deleteSession: deleteSessionMock,
}));

function createRequest(origin?: string): Request {
  return new Request("http://localhost/api/auth/logout", {
    method: "POST",
    headers: origin ? { Origin: origin } : undefined,
  });
}

describe("logout API origin protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the session for a same-origin request", async () => {
    const response = await POST(createRequest("http://localhost"));

    expect(response.status).toBe(200);
    expect(deleteSessionMock).toHaveBeenCalledOnce();
  });

  it("rejects a cross-site request without deleting the session", async () => {
    const response = await POST(createRequest("https://attacker.example"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Cross-site requests are not allowed.",
    });
    expect(deleteSessionMock).not.toHaveBeenCalled();
  });

  it("rejects a request without an origin", async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(deleteSessionMock).not.toHaveBeenCalled();
  });
});
