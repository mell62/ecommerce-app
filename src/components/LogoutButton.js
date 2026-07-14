"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log out.");
      }

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="disabled:opacity-50"
    >
      {isLoggingOut ? "Logging Out..." : "Log Out"}
    </button>
  );
}
