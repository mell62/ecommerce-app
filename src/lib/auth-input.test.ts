import { describe, expect, it } from "vitest";
import {
  AUTH_EMAIL_MAX_LENGTH,
  AUTH_NAME_MAX_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  validateLoginInput,
  validateRegistrationInput,
} from "@/lib/auth-input";

describe("authentication input", () => {
  it("normalizes valid login credentials", () => {
    expect(
      validateLoginInput({
        email: "  WATSON@EXAMPLE.COM  ",
        password: "password123",
      })
    ).toEqual({
      success: true,
      data: {
        email: "watson@example.com",
        password: "password123",
      },
    });
  });

  it.each([
    { email: "not-an-email", password: "password123" },
    { email: `${"a".repeat(AUTH_EMAIL_MAX_LENGTH)}@example.com`, password: "password123" },
  ])("rejects an invalid login email", (input) => {
    expect(validateLoginInput(input)).toEqual({
      success: false,
      error: "Enter a valid email address.",
    });
  });

  it("rejects an oversized login password", () => {
    expect(
      validateLoginInput({
        email: "watson@example.com",
        password: "a".repeat(AUTH_PASSWORD_MAX_LENGTH + 1),
      })
    ).toEqual({
      success: false,
      error: `Password must be ${AUTH_PASSWORD_MAX_LENGTH} characters or fewer.`,
    });
  });

  it("normalizes valid registration details", () => {
    expect(
      validateRegistrationInput({
        name: "  John Watson  ",
        email: "  WATSON@EXAMPLE.COM  ",
        password: "password123",
      })
    ).toEqual({
      success: true,
      data: {
        name: "John Watson",
        email: "watson@example.com",
        password: "password123",
      },
    });
  });

  it("rejects an oversized registration name", () => {
    expect(
      validateRegistrationInput({
        name: "a".repeat(AUTH_NAME_MAX_LENGTH + 1),
        email: "watson@example.com",
        password: "password123",
      })
    ).toEqual({
      success: false,
      error: `Name must be ${AUTH_NAME_MAX_LENGTH} characters or fewer.`,
    });
  });
});
