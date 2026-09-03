import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function restoreEnvironmentVariable(
  name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET",
  value: string | undefined
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("Stripe configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  afterEach(() => {
    restoreEnvironmentVariable("STRIPE_SECRET_KEY", originalStripeSecretKey);
    restoreEnvironmentVariable(
      "STRIPE_WEBHOOK_SECRET",
      originalStripeWebhookSecret
    );
  });

  it("rejects a missing Stripe secret key", async () => {
    const { getStripeClient } = await import("@/lib/stripe");

    expect(() => getStripeClient()).toThrow(
      "STRIPE_SECRET_KEY is not configured."
    );
  });

  it("rejects a malformed Stripe secret key", async () => {
    process.env.STRIPE_SECRET_KEY = "not-a-stripe-key";
    const { getStripeClient } = await import("@/lib/stripe");

    expect(() => getStripeClient()).toThrow(
      "STRIPE_SECRET_KEY has an invalid format."
    );
  });

  it("reuses one Stripe client for the server process", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    const { getStripeClient } = await import("@/lib/stripe");

    expect(getStripeClient()).toBe(getStripeClient());
  });

  it("returns a configured webhook signing secret", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_example";
    const { getStripeWebhookSecret } = await import("@/lib/stripe");

    expect(getStripeWebhookSecret()).toBe("whsec_example");
  });

  it("rejects a malformed webhook signing secret", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "not-a-webhook-secret";
    const { getStripeWebhookSecret } = await import("@/lib/stripe");

    expect(() => getStripeWebhookSecret()).toThrow(
      "STRIPE_WEBHOOK_SECRET has an invalid format."
    );
  });
});
