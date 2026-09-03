import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getStripeSecretKey(): string {
  const secretKey = getRequiredEnvironmentVariable("STRIPE_SECRET_KEY");

  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    throw new Error("STRIPE_SECRET_KEY has an invalid format.");
  }

  return secretKey;
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  const webhookSecret = getRequiredEnvironmentVariable(
    "STRIPE_WEBHOOK_SECRET"
  );

  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET has an invalid format.");
  }

  return webhookSecret;
}
