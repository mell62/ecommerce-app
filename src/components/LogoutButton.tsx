"use client";

import { useId, useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      setError("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const contentType = response.headers.get("content-type");
      const data: unknown = contentType?.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to log out.";

        throw new Error(message);
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      setError(
        error instanceof TypeError
          ? "Unable to log out. Check your connection and try again."
          : error instanceof Error
            ? error.message
            : "Failed to log out."
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative flex flex-col">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-busy={isLoggingOut}
        aria-describedby={error ? errorId : undefined}
        className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:border-border-hover hover:text-brand-700 disabled:cursor-wait disabled:opacity-50"
      >
        {isLoggingOut ? "Logging Out..." : "Log Out"}
      </button>

      {error && (
        <p
          id={errorId}
          className="mt-2 rounded-ui border border-danger/25 bg-surface px-3 py-2 text-sm text-danger shadow-sm lg:absolute lg:right-0 lg:top-full lg:z-50 lg:w-64 lg:shadow-card"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
