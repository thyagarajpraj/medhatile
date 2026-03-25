import { type FormEvent, useMemo, useState } from "react";
import type { AuthCredentials, AuthMode } from "../types/auth";

type AuthGateProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  statusMessage: string | null;
  onAuthenticate: (mode: AuthMode, credentials: AuthCredentials) => Promise<void>;
};

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns whether an email string satisfies the basic auth validation pattern.
 */
function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

/**
 * Renders the mobile-first full-screen auth gate for login and registration.
 */
export function AuthGate({ errorMessage, isSubmitting, statusMessage, onAuthenticate }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isRegisterMode = mode === "register";
  const activeMessage = validationMessage ?? errorMessage;
  const buttonLabel = isRegisterMode ? "Create Account" : "Sign In";
  const helperMessage = useMemo(
    () => "Your best score stays on this device and also syncs to your account.",
    [],
  );

  /**
   * Switches between login and register modes while clearing password inputs.
   */
  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setValidationMessage(null);
  };

  /**
   * Validates and submits the current auth form.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
  };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-5xl items-center justify-center py-3 sm:min-h-[calc(100dvh-2rem)]">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">MedhaTile</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {isRegisterMode ? "Create your account" : "Sign in to continue"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Train your memory, keep your progress, and sync your best score across sessions.
          </p>

          <div className="mt-5 inline-flex w-full rounded-2xl border border-slate-300 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                !isRegisterMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isRegisterMode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Register
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-slate-500"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <input
                type="password"
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-slate-500"
                placeholder="At least 8 characters"
              />
            </label>

            {isRegisterMode && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Confirm Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-slate-500"
                  placeholder="Re-enter your password"
                />
              </label>
            )}

            {activeMessage && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {activeMessage}
              </p>
            )}
            {statusMessage && (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {statusMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-12 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
            >
              {isSubmitting ? "Working..." : buttonLabel}
            </button>
          </form>

          <p className="mt-4 text-sm leading-6 text-slate-500">{helperMessage}</p>
        </div>
      </div>
    </section>
  );
}
