import { deleteSession } from "@/lib/session";

export async function POST(): Promise<Response> {
  await deleteSession();

  return Response.json({
    message: "Logged out successfully.",
  });
}
