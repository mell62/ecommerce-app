"use client";

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
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-3xl font-bold">Create Account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block font-medium">
            Name
          </label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block font-medium">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-medium">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="w-full rounded border px-3 py-2"
          />

          <p className="mt-1 text-sm text-gray-600">
            Use at least 8 characters.
          </p>
        </div>

        {error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </main>
  );
}
