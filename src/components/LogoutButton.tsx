"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data: unknown = await response.json();

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

      alert(error instanceof Error ? error.message : "Failed to log out.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:border-border-hover hover:text-brand-700 disabled:opacity-50"
    >
      {isLoggingOut ? "Logging Out..." : "Log Out"}
    </button>
  );
}
