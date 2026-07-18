import argon2 from "argon2";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";

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
