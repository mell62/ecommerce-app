"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function getRegistrationError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to create account.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setError("");

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(getRegistrationError(data));
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-12rem)] w-full max-w-[var(--store-container)] items-center gap-10 px-[var(--store-page-gutter)] py-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-16 lg:py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Join Zeus
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Make every visit feel familiar.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg">
          Create an account to keep the products you care about close and make
          your next visit easier.
        </p>

        <div className="mt-8 grid max-w-xl gap-3 text-sm text-muted sm:grid-cols-3">
          {["Save favorites", "Keep your cart", "Review purchases"].map(
            (benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 border-l-2 border-brand-100 pl-3"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-brand-600"
                />
                {benefit}
              </div>
            )
          )}
        </div>
      </section>

      <section className="rounded-ui border border-border bg-surface p-5 shadow-card sm:p-7">
        <div>
          <p className="text-sm font-semibold text-brand-700">Zeus account</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            A few details are all you need to get started.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "registration-error" : undefined}
              placeholder="Your name"
              className="store-field min-h-12 w-full rounded-ui border border-border bg-surface px-3.5 py-2.5 text-foreground shadow-sm placeholder:text-muted/70 hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "registration-error" : undefined}
              placeholder="you@example.com"
              className="store-field min-h-12 w-full rounded-ui border border-border bg-surface px-3.5 py-2.5 text-foreground shadow-sm placeholder:text-muted/70 hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-foreground"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                minLength={8}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
                aria-describedby={`password-help${
                  error ? " registration-error" : ""
                }`}
                className="store-field min-h-12 w-full rounded-ui border border-border bg-surface py-2.5 pl-3.5 pr-16 text-foreground shadow-sm hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0.5 right-1 inline-flex min-w-12 items-center justify-center rounded-ui px-2 text-xs font-semibold text-muted hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p id="password-help" className="mt-2 text-sm text-muted">
              Use at least 8 characters.
            </p>
          </div>

          {error && (
            <p
              id="registration-error"
              className="rounded-ui border border-danger/25 bg-danger/5 px-4 py-3 text-sm leading-6 text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-ui bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
              />
            )}
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 border-t border-border pt-5 text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </section>
    </div>
  );
}
