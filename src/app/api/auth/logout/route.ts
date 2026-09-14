import { deleteSession } from "@/lib/session";
import { isSameOriginRequest } from "@/lib/request-origin";

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "Cross-site requests are not allowed." },
      { status: 403 }
    );
  }

  await deleteSession();

  return Response.json({
    message: "Logged out successfully.",
  });
}
