"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { AuthCredentials } from "@medhatile/shared-types";
import {
  Card,
  FieldLabel,
  Muted,
  Panel,
  PrimaryButton,
  Shell,
  StatusBanner,
  TextInput,
} from "@/src/components/ui";
import { cn } from "@/src/lib/cn";

export type AuthMode = "login" | "register";

type AuthGateProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  statusMessage: string | null;
  onAuthenticate: (mode: AuthMode, credentials: AuthCredentials) => Promise<void>;
};

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns whether an email string matches the minimum sign-in format.
 */
function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Renders the shared login and registration gate for the web app.
 */
export function AuthGate({ errorMessage, isSubmitting, statusMessage, onAuthenticate }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isRegisterMode = mode === "register";
  const activeMessage = validationMessage ?? errorMessage;
  const buttonLabel = isRegisterMode ? "Create account" : "Login";
  const helperMessage = useMemo(
    () => "Your best score stays on this device and also syncs to your account.",
    [],
  );

  /**
   * Switches between login and register modes while resetting password inputs.
   */
  function handleModeChange(nextMode: AuthMode): void {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setValidationMessage(null);
  }

  /**
   * Validates and submits the current auth form values.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setValidationMessage("Enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setValidationMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setValidationMessage("Confirm Password must match Password.");
      return;
    }

    setValidationMessage(null);
    await onAuthenticate(mode, {
      email: normalizedEmail,
      password,
    });
  }

  return (
    <Shell className="flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-accent-violet text-2xl font-black text-white shadow-lg shadow-brand-700/30">
            M
          </div>
          <p className="text-xs font-extrabold tracking-[0.25em] text-brand-500 uppercase">MedhaTile</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900">
            {isRegisterMode ? "Create your account" : "Welcome back"}
          </h1>
          <Muted className="mt-2">Use the same account on web and mobile.</Muted>
        </div>

        <Panel>
          <Card className="border-0 bg-transparent p-6 shadow-none">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/80 p-1">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition",
                    mode === tab
                      ? "bg-white text-brand-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                  onClick={() => handleModeChange(tab)}
                >
                  {tab === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            {statusMessage ? <StatusBanner>{statusMessage}</StatusBanner> : null}
            {activeMessage ? <StatusBanner variant="error">{activeMessage}</StatusBanner> : null}

            <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
              <FieldLabel>
                Email
                <TextInput
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  required
                />
              </FieldLabel>
              <FieldLabel>
                Password
                <TextInput
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </FieldLabel>
              {isRegisterMode ? (
                <FieldLabel>
                  Confirm Password
                  <TextInput
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </FieldLabel>
              ) : null}
              <PrimaryButton className="w-full py-3" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Working..." : buttonLabel}
              </PrimaryButton>
            </form>
            <Muted className="mt-4 text-center text-xs">{helperMessage}</Muted>
          </Card>
        </Panel>
      </div>
    </Shell>
  );
}
