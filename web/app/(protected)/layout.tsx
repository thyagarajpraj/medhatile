"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/lib/AppShell";
import { SessionRestoreScreen, useAuth } from "@/lib/AuthProvider";

/**
 * Guards authenticated routes and renders the shared app shell.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isRestoringSession } = useAuth();
  const isIdentifyingRoute = pathname === "/games/identifying";

  useEffect(() => {
    if (!isRestoringSession && !session) {
      router.replace("/login");
    }
  }, [isRestoringSession, session, router]);

  if (isRestoringSession || !session) {
    return <SessionRestoreScreen />;
  }

  if (isIdentifyingRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
