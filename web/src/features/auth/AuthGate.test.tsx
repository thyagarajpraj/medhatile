import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthGate } from "./AuthGate";

/**
 * Creates a reusable async auth handler spy for form tests.
 */
function createAuthHandler() {
  return vi.fn().mockResolvedValue(undefined);
}

describe("AuthGate", () => {
  it("shows confirm password in register mode and blocks mismatched passwords", async () => {
    const onAuthenticate = createAuthHandler();

    render(
      <AuthGate
        errorMessage={null}
        isSubmitting={false}
        statusMessage={null}
        onAuthenticate={onAuthenticate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "USER@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password456" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    expect(screen.getByText("Confirm Password must match Password.")).toBeInTheDocument();
    expect(onAuthenticate).not.toHaveBeenCalled();
  });

  it("normalizes login email and submits valid credentials", async () => {
    const onAuthenticate = createAuthHandler();

    render(
      <AuthGate
        errorMessage={null}
        isSubmitting={false}
        statusMessage={null}
        onAuthenticate={onAuthenticate}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "  USER@example.com  " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getAllByRole("button", { name: "Login" })[1].closest("form")!);

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledTimes(1));
    expect(onAuthenticate).toHaveBeenCalledWith("login", {
      email: "user@example.com",
      password: "password123",
    });
  });
});
