import { getCurrentUser } from "@/lib/session";

export async function GET(): Promise<Response> {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user,
  });
}
