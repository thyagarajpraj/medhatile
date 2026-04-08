import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AuthCredentials } from "@medhatile/shared-types";
import { normalizeEmail, type AuthMode, validateAuthInput } from "./authValidation";

type AuthGateProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  statusMessage: string | null;
  onAuthenticate: (mode: AuthMode, credentials: AuthCredentials) => Promise<void>;
};

/**
 * Renders the mobile login and registration gate.
 */
export function AuthGate({ errorMessage, isSubmitting, statusMessage, onAuthenticate }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const isRegisterMode = mode === "register";
  const activeMessage = validationMessage ?? errorMessage;

  /**
   * Switches the auth mode and resets password-only inputs.
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
   * Validates and submits the current auth form.
   */
  async function handleSubmit(): Promise<void> {
    const nextMessage = validateAuthInput(mode, email, password, confirmPassword);

    if (nextMessage) {
      setValidationMessage(nextMessage);
      return;
    }

    setValidationMessage(null);
    await onAuthenticate(mode, {
      email: normalizeEmail(email),
      password,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.helperText}>Use the same backend account on mobile and web.</Text>
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => handleModeChange("login")}
          style={[styles.modeButton, mode === "login" ? styles.modeButtonActive : styles.modeButtonInactive]}
        >
          <Text style={[styles.modeButtonLabel, mode === "login" ? styles.modeButtonLabelActive : styles.modeButtonLabelInactive]}>
            Login
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleModeChange("register")}
          style={[styles.modeButton, mode === "register" ? styles.modeButtonActive : styles.modeButtonInactive]}
        >
          <Text
            style={[
              styles.modeButtonLabel,
              mode === "register" ? styles.modeButtonLabelActive : styles.modeButtonLabelInactive,
            ]}
          >
            Register
          </Text>
        </Pressable>
      </View>

      {statusMessage ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}

      {activeMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{activeMessage}</Text>
        </View>
      ) : null}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
      />
      {isRegisterMode ? (
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
          style={styles.input}
        />
      ) : null}
      <Pressable onPress={() => void handleSubmit()} style={styles.submitButton} disabled={isSubmitting}>
        <Text style={styles.submitButtonLabel}>
          {isSubmitting ? "Working..." : isRegisterMode ? "Create account" : "Login"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  helperText: {
    color: "#64748b",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeButton: {
    padding: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  modeButtonActive: {
    backgroundColor: "#132238",
  },
  modeButtonInactive: {
    backgroundColor: "#ffffff",
  },
  modeButtonLabel: {
    fontWeight: "700",
  },
  modeButtonLabelActive: {
    color: "#ffffff",
  },
  modeButtonLabelInactive: {
    color: "#132238",
  },
  statusCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 12,
  },
  statusText: {
    color: "#1d4ed8",
  },
  errorCard: {
    backgroundColor: "#fff1f2",
    borderRadius: 16,
    padding: 12,
  },
  errorText: {
    color: "#be123c",
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  submitButton: {
    backgroundColor: "#132238",
    borderRadius: 14,
    padding: 14,
  },
  submitButtonLabel: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
  },
});
