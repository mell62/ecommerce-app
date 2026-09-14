export const AUTH_NAME_MAX_LENGTH = 80;
export const AUTH_EMAIL_MAX_LENGTH = 254;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

type LoginInput = Readonly<{
  email: string;
  password: string;
}>;

type RegistrationInput = LoginInput &
  Readonly<{
    name: string;
  }>;

type ValidationResult<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; error: string }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginInput(
  value: unknown
): ValidationResult<LoginInput> {
  if (!isRecord(value)) {
    return { success: false, error: "Email and password are required." };
  }

  const email = typeof value.email === "string"
    ? value.email.trim().toLowerCase()
    : "";
  const password = typeof value.password === "string" ? value.password : "";

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (email.length > AUTH_EMAIL_MAX_LENGTH || !isValidEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  if (password.length > AUTH_PASSWORD_MAX_LENGTH) {
    return {
      success: false,
      error: `Password must be ${AUTH_PASSWORD_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { success: true, data: { email, password } };
}

export function validateRegistrationInput(
  value: unknown
): ValidationResult<RegistrationInput> {
  if (!isRecord(value)) {
    return {
      success: false,
      error: "Name, email, and password are required.",
    };
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const loginResult = validateLoginInput(value);

  if (!name || !value.email || !value.password) {
    return {
      success: false,
      error: "Name, email, and password are required.",
    };
  }

  if (name.length > AUTH_NAME_MAX_LENGTH) {
    return {
      success: false,
      error: `Name must be ${AUTH_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (!loginResult.success) {
    return loginResult;
  }

  if (loginResult.data.password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  return {
    success: true,
    data: {
      name,
      ...loginResult.data,
    },
  };
}
