"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Clean trailing slash for matching
  const cleanPath = pathname?.replace(/\/$/, "") || "";
  const isLoginPage = cleanPath === "/admin" || !pathname;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
