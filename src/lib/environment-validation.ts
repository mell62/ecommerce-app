type Environment = Readonly<Record<string, string | undefined>>;

const requiredVariables = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "RATE_LIMIT_SECRET",
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "DEEPSEEK_API_KEY",
] as const;

function getValue(environment: Environment, name: string): string {
  return environment[name]?.trim() ?? "";
}

function isPlaceholder(value: string): boolean {
  return /(?:replace[-_]|your-project|USER:PASSWORD@HOST)/i.test(value);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function validateServerEnvironment(
  environment: Environment
): string[] {
  const errors: string[] = [];

  for (const name of requiredVariables) {
    const value = getValue(environment, name);

    if (!value) {
      errors.push(`${name} is required.`);
    } else if (isPlaceholder(value)) {
      errors.push(`${name} still contains a placeholder value.`);
    }
  }

  const databaseUrl = parseUrl(getValue(environment, "DATABASE_URL"));

  if (
    databaseUrl &&
    databaseUrl.protocol !== "postgres:" &&
    databaseUrl.protocol !== "postgresql:"
  ) {
    errors.push("DATABASE_URL must use the PostgreSQL protocol.");
  }

  const sessionSecret = getValue(environment, "SESSION_SECRET");
  const rateLimitSecret = getValue(environment, "RATE_LIMIT_SECRET");

  if (sessionSecret && sessionSecret.length < 32) {
    errors.push("SESSION_SECRET must be at least 32 characters long.");
  }

  if (rateLimitSecret && rateLimitSecret.length < 32) {
    errors.push("RATE_LIMIT_SECRET must be at least 32 characters long.");
  }

  if (sessionSecret && rateLimitSecret && sessionSecret === rateLimitSecret) {
    errors.push("RATE_LIMIT_SECRET must be different from SESSION_SECRET.");
  }

  const baseUrl = parseUrl(getValue(environment, "NEXT_PUBLIC_BASE_URL"));

  if (baseUrl) {
    const isLocalDevelopmentUrl =
      baseUrl.protocol === "http:" &&
      (baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1");

    if (baseUrl.protocol !== "https:" && !isLocalDevelopmentUrl) {
      errors.push(
        "NEXT_PUBLIC_BASE_URL must use HTTPS except during local development."
      );
    }

    if (baseUrl.username || baseUrl.password) {
      errors.push("NEXT_PUBLIC_BASE_URL must not contain credentials.");
    }
  }

  const supabaseUrl = parseUrl(
    getValue(environment, "NEXT_PUBLIC_SUPABASE_URL")
  );

  if (supabaseUrl && supabaseUrl.protocol !== "https:") {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must use HTTPS.");
  }

  const supabaseSecret = getValue(environment, "SUPABASE_SECRET_KEY");

  if (supabaseSecret && !supabaseSecret.startsWith("sb_secret_")) {
    errors.push("SUPABASE_SECRET_KEY has an invalid format.");
  }

  const stripeSecret = getValue(environment, "STRIPE_SECRET_KEY");

  if (
    stripeSecret &&
    !stripeSecret.startsWith("sk_test_") &&
    !stripeSecret.startsWith("sk_live_")
  ) {
    errors.push("STRIPE_SECRET_KEY has an invalid format.");
  }

  const stripeWebhookSecret = getValue(
    environment,
    "STRIPE_WEBHOOK_SECRET"
  );

  if (
    stripeWebhookSecret &&
    !stripeWebhookSecret.startsWith("whsec_")
  ) {
    errors.push("STRIPE_WEBHOOK_SECRET has an invalid format.");
  }

  const deepSeekApiKey = getValue(environment, "DEEPSEEK_API_KEY");

  if (
    deepSeekApiKey &&
    !deepSeekApiKey.startsWith("sk-") &&
    !deepSeekApiKey.startsWith("sk_")
  ) {
    errors.push("DEEPSEEK_API_KEY has an invalid format.");
  }

  return errors;
}
