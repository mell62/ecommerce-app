import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  getStripeOrderReference,
  getStripePaymentIntentId,
} from "@/lib/stripe-session";

const checkoutSession = {
  id: "cs_test_checkout",
  amount_total: 6106,
  currency: "usd",
  metadata: {
    orderId: "order-1",
    userId: "customer-1",
  },
  payment_intent: "pi_test_payment",
} as unknown as Stripe.Checkout.Session;

describe("Stripe Checkout Session parsing", () => {
  it("builds a trusted order reference from required Session fields", () => {
    expect(getStripeOrderReference(checkoutSession)).toEqual({
      orderId: "order-1",
      userId: "customer-1",
      sessionId: "cs_test_checkout",
      amountTotal: 6106,
      currency: "usd",
    });
  });

  it("rejects incomplete order metadata", () => {
    expect(() =>
      getStripeOrderReference({
        ...checkoutSession,
        metadata: null,
      } as Stripe.Checkout.Session)
    ).toThrow("metadata is incomplete");
  });

  it("reads a compact Payment Intent ID", () => {
    expect(getStripePaymentIntentId(checkoutSession)).toBe("pi_test_payment");
  });

  it("reads an expanded Payment Intent object", () => {
    expect(
      getStripePaymentIntentId({
        ...checkoutSession,
        payment_intent: {
          id: "pi_expanded_payment",
        } as Stripe.PaymentIntent,
      } as Stripe.Checkout.Session)
    ).toBe("pi_expanded_payment");
  });

  it("rejects a Session without a Payment Intent", () => {
    expect(() =>
      getStripePaymentIntentId({
        ...checkoutSession,
        payment_intent: null,
      } as Stripe.Checkout.Session)
    ).toThrow("missing a Payment Intent");
  });
});
