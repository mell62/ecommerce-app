import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

type SessionUser = Pick<User, "id" | "role">;

interface SessionPayload extends JWTPayload {
  userId: string;
  role: string;
}

export type CurrentUser = Pick<User, "id" | "name" | "email" | "role">;

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);

  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
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
    const { payload } = await jwtVerify<SessionPayload>(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    return payload;
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
