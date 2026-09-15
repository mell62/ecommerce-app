import { describe, expect, it } from "vitest";
import { validateServerEnvironment } from "@/lib/environment-validation";

const validEnvironment = {
  DATABASE_URL: "postgresql://user:password@database.example.com:5432/store",
  SESSION_SECRET: "session-secret-with-at-least-32-characters",
  RATE_LIMIT_SECRET: "rate-limit-secret-with-at-least-32-characters",
  NEXT_PUBLIC_BASE_URL: "https://shop.example.com",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_server-key",
  STRIPE_SECRET_KEY: "sk_test_example-key",
  STRIPE_WEBHOOK_SECRET: "whsec_example-key",
  DEEPSEEK_API_KEY: "sk-example-key",
};

describe("server environment validation", () => {
  it("accepts a complete production configuration", () => {
    expect(validateServerEnvironment(validEnvironment)).toEqual([]);
  });

  it("allows an HTTP base URL only for local development", () => {
    expect(
      validateServerEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
      })
    ).toEqual([]);
    expect(
      validateServerEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_BASE_URL: "http://shop.example.com",
      })
    ).toContain(
      "NEXT_PUBLIC_BASE_URL must use HTTPS except during local development."
    );
  });

  it("rejects a local HTTP base URL in production", () => {
    expect(
      validateServerEnvironment(
        { ...validEnvironment, NEXT_PUBLIC_BASE_URL: "http://localhost:3000" },
        true
      )
    ).toContain("NEXT_PUBLIC_BASE_URL must use HTTPS in production.");

    expect(validateServerEnvironment(validEnvironment, true)).toEqual([]);
  });

  it("reports missing variables without exposing secret values", () => {
    const errors = validateServerEnvironment({});

    expect(errors).toContain("DATABASE_URL is required.");
    expect(errors).toContain("SESSION_SECRET is required.");
    expect(errors).toContain("SUPABASE_SECRET_KEY is required.");
    expect(errors.join(" ")).not.toContain("undefined");
  });

  it("rejects weak or reused application secrets", () => {
    const errors = validateServerEnvironment({
      ...validEnvironment,
      SESSION_SECRET: "same-secret",
      RATE_LIMIT_SECRET: "same-secret",
    });

    expect(errors).toContain(
      "SESSION_SECRET must be at least 32 characters long."
    );
    expect(errors).toContain(
      "RATE_LIMIT_SECRET must be at least 32 characters long."
    );
    expect(errors).toContain(
      "RATE_LIMIT_SECRET must be different from SESSION_SECRET."
    );
  });

  it("rejects placeholder and malformed service configuration", () => {
    const errors = validateServerEnvironment({
      ...validEnvironment,
      DATABASE_URL: "mysql://user:password@database.example.com/store",
      NEXT_PUBLIC_SUPABASE_URL: "http://project.supabase.co",
      SUPABASE_SECRET_KEY: "public-key",
      STRIPE_SECRET_KEY: "pk_test_public-key",
      STRIPE_WEBHOOK_SECRET: "not-a-webhook-secret",
      DEEPSEEK_API_KEY: "not-an-api-key",
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        "DATABASE_URL must use the PostgreSQL protocol.",
        "NEXT_PUBLIC_SUPABASE_URL must use HTTPS.",
        "SUPABASE_SECRET_KEY has an invalid format.",
        "STRIPE_SECRET_KEY has an invalid format.",
        "STRIPE_WEBHOOK_SECRET has an invalid format.",
        "DEEPSEEK_API_KEY has an invalid format.",
      ])
    );
  });
});
