import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AuthGate } from "./AuthGate";

/**
 * Creates a reusable no-op auth handler for form tests.
 */
function createAuthHandler() {
  return vi.fn().mockResolvedValue(undefined);
}

describe("AuthGate", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows confirm password in register mode and blocks mismatched passwords", async () => {
    const onAuthenticate = createAuthHandler();

    const { container } = render(
      <AuthGate
        errorMessage={null}
        isSubmitting={false}
        statusMessage={null}
        onAuthenticate={onAuthenticate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByText("Confirm Password")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "USER@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password456" } });
    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Auth form was not rendered");
    }

    fireEvent.click(within(form).getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Confirm Password must match Password.")).toBeInTheDocument();
    expect(onAuthenticate).not.toHaveBeenCalled();
  });

  it("normalizes login email and submits valid credentials", async () => {
    const onAuthenticate = createAuthHandler();

    const { container } = render(
      <AuthGate
        errorMessage={null}
        isSubmitting={false}
        statusMessage={null}
        onAuthenticate={onAuthenticate}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  USER@example.com  " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Auth form was not rendered");
    }

    fireEvent.click(within(form).getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledTimes(1));
    expect(onAuthenticate).toHaveBeenCalledWith("login", {
      email: "user@example.com",
      password: "password123",
    });
  });

  it("rejects short passwords before submitting", async () => {
    const onAuthenticate = createAuthHandler();

    const { container } = render(
      <AuthGate
        errorMessage={null}
        isSubmitting={false}
        statusMessage={null}
        onAuthenticate={onAuthenticate}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Auth form was not rendered");
    }

    fireEvent.click(within(form).getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(onAuthenticate).not.toHaveBeenCalled();
  });
});
