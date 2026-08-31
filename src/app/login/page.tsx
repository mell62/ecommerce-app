"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function getLoginError(data: unknown): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Failed to log in.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRedirect = searchParams.get("redirect");

  const redirectPath =
    requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
      ? requestedRedirect
      : "/";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setError("");

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        throw new Error(getLoginError(data));
      }

      setPassword("");
      router.push(redirectPath);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-12rem)] w-full max-w-[var(--store-container)] items-center gap-10 px-[var(--store-page-gutter)] py-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-16 lg:py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Return to your Zeus setup.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg">
          Pick up where you left off. Your wishlist, shopping cart, and past
          orders will be ready when you return.
        </p>

        <div className="mt-8 grid max-w-xl gap-3 text-sm text-muted sm:grid-cols-3">
          {["Your wishlist", "Shopping cart", "Past orders"].map((benefit) => (
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
          ))}
        </div>
      </section>

      <section className="rounded-ui border border-border bg-surface p-5 shadow-card sm:p-7">
        <div>
          <p className="text-sm font-semibold text-brand-700">Zeus account</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
            Log in
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Enter the details associated with your account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className="mt-6 space-y-5"
        >
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
              aria-describedby={error ? "login-error" : undefined}
              placeholder="you@example.com"
              className="min-h-12 w-full rounded-ui border border-border bg-surface px-3.5 py-2.5 text-foreground shadow-sm placeholder:text-muted/70 hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70"
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
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className="min-h-12 w-full rounded-ui border border-border bg-surface py-2.5 pl-3.5 pr-16 text-foreground shadow-sm hover:border-border-hover disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                disabled={isSubmitting}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-1 right-1 inline-flex min-w-12 items-center justify-center rounded-ui px-2 text-xs font-semibold text-muted hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p
              id="login-error"
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
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 border-t border-border pt-5 text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-700 underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </section>
    </div>
  );
}
