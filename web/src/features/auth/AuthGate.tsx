import { type FormEvent, useMemo, useState } from "react";
import type { AuthCredentials } from "@medhatile/shared-types";

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
    <div className="shell">
      <div className="panel auth-card">
        <div className="panel-inner">
          <div className="card auth-surface">
            <p className="muted auth-kicker">MEDHATILE</p>
            <h1>{isRegisterMode ? "Create your account" : "Sign in to continue"}</h1>
            <p className="muted">Use the same account on web and mobile. Register if you do not have one yet.</p>
            <div className="nav auth-mode-toggle" style={{ marginTop: 16, marginBottom: 16 }}>
              <button
                type="button"
                className={mode === "login" ? "primary-button" : "ghost-button"}
                onClick={() => handleModeChange("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "register" ? "primary-button" : "ghost-button"}
                onClick={() => handleModeChange("register")}
              >
                Register
              </button>
            </div>
            {statusMessage ? <div className="status">{statusMessage}</div> : null}
            {activeMessage ? <div className="status error">{activeMessage}</div> : null}
            <form className="field-row" onSubmit={(event) => void handleSubmit(event)}>
              <label className="field">
                <span>Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  minLength={8}
                  required
                />
              </label>
              {isRegisterMode ? (
                <label className="field">
                  <span>Confirm Password</span>
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              ) : null}
              <button className="primary-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Working..." : buttonLabel}
              </button>
            </form>
            <p className="muted auth-helper-text">{helperMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
