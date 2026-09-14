import argon2 from "argon2";
import { validateRegistrationInput } from "@/lib/auth-input";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientAddress } from "@/lib/request-client";
import { isSameOriginRequest } from "@/lib/request-origin";
import { createSession } from "@/lib/session";

const REGISTRATION_LIMIT = 10;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;

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

    const result = validateRegistrationInput(await getRequestBody(request));

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    const { name, email, password } = result.data;

    const rateLimit = await consumeRateLimit({
      namespace: "auth:register",
      identifier: getClientAddress(request),
      limit: REGISTRATION_LIMIT,
      windowMs: REGISTRATION_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many accounts created. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await createSession(user);

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
