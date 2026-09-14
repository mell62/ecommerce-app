import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 60 * 60 * 24 * 7;
const SESSION_SECRET_MIN_LENGTH = 32;
const SESSION_ISSUER = "zeus";
const SESSION_AUDIENCE = "zeus-web";

type SessionUser = Pick<User, "id">;

interface SessionPayload extends JWTPayload {
  userId: string;
}

export type CurrentUser = Pick<User, "id" | "name" | "email" | "role">;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  if (secret.length < SESSION_SECRET_MIN_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be at least ${SESSION_SECRET_MIN_LENGTH} characters long.`
    );
  }

  return new TextEncoder().encode(secret);
}

function isSessionPayload(payload: JWTPayload): payload is SessionPayload {
  return (
    typeof payload.userId === "string" &&
    Boolean(payload.userId) &&
    payload.sub === payload.userId
  );
}

export async function createSession(user: SessionUser): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);

  const token = await new SignJWT({
    userId: user.id,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(user.id)
    .setExpirationTime(expiresAt)
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    return isSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return user;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}
