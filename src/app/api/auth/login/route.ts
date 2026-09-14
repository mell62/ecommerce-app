import argon2 from "argon2";
import { validateLoginInput } from "@/lib/auth-input";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientAddress } from "@/lib/request-client";
import { isSameOriginRequest } from "@/lib/request-origin";
import { createSession } from "@/lib/session";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

async function getRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!isSameOriginRequest(request)) {
      return Response.json(
        { error: "Cross-site requests are not allowed." },
        { status: 403 }
      );
    }

    const result = validateLoginInput(await getRequestBody(request));

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const { email, password } = result.data;

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
