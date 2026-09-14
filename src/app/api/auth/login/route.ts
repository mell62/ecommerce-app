import argon2 from "argon2";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientAddress } from "@/lib/request-client";
import { createSession } from "@/lib/session";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body: LoginRequestBody = await request.json();

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const rateLimit = await consumeRateLimit({
      namespace: "auth:login",
      identifier: `${getClientAddress(request)}:${email}`,
      limit: LOGIN_ATTEMPT_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValidPassword = await argon2.verify(user.password, password);

    if (!isValidPassword) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createSession(user);

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);

    return Response.json({ error: "Failed to log in." }, { status: 500 });
  }
}
