import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-auth";

type AdminLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/login?redirect=/admin");
  }

  if (access.status === "forbidden") {
    notFound();
  }

  return children;
}
