import "server-only";

import { getCurrentUser, type CurrentUser } from "@/lib/session";

export const ADMIN_ROLE = "ADMIN";

export type AdminAccess =
  | Readonly<{
      status: "authorized";
      user: CurrentUser;
    }>
  | Readonly<{
      status: "unauthenticated";
    }>
  | Readonly<{
      status: "forbidden";
      user: CurrentUser;
    }>;

export async function getAdminAccess(): Promise<AdminAccess> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "unauthenticated",
    };
  }

  if (user.role !== ADMIN_ROLE) {
    return {
      status: "forbidden",
      user,
    };
  }

  return {
    status: "authorized",
    user,
  };
}
