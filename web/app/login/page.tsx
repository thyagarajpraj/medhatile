"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/src/features/auth/AuthGate";
import { SessionRestoreScreen, useAuth } from "@/lib/AuthProvider";

/**
 * Login and registration page for unauthenticated users.
 */
export default function LoginPage() {
  const router = useRouter();
  const {
    session,
    isRestoringSession,
    authenticate,
    authErrorMessage,
    authStatusMessage,
    isAuthSubmitting,
  } = useAuth();

  useEffect(() => {
    if (!isRestoringSession && session) {
      router.replace("/");
    }
  }, [isRestoringSession, session, router]);

  if (isRestoringSession) {
    return <SessionRestoreScreen />;
  }

  if (session) {
    return <SessionRestoreScreen />;
  }

  return (
    <AuthGate
      errorMessage={authErrorMessage}
      isSubmitting={isAuthSubmitting}
      statusMessage={authStatusMessage}
      onAuthenticate={authenticate}
    />
  );
}
