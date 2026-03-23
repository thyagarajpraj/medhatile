import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Tile } from "./Tile";

afterEach(() => {
  cleanup();
});

describe("Tile", () => {
  it("renders marker text for each interactive state", () => {
    const noop = vi.fn();

    const { rerender } = render(<Tile index={0} state="selected_correct" disabled={false} onClick={noop} />);
    expect(screen.getByRole("button", { name: "Tile 1" })).toHaveTextContent("OK");

    rerender(<Tile index={1} state="answer" disabled={true} onClick={noop} />);
    expect(screen.getByRole("button", { name: "Tile 2" })).toHaveTextContent(".");

    rerender(<Tile index={2} state="wrong" disabled={true} onClick={noop} />);
    expect(screen.getByRole("button", { name: "Tile 3" })).toHaveTextContent("X");
  });

  it("calls onClick with index when enabled", () => {
    const onClick = vi.fn();
    render(<Tile index={4} state="default" disabled={false} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Tile 5" }));
    expect(onClick).toHaveBeenCalledWith(4);
  });

  it("is disabled when disabled prop is true", () => {
    const onClick = vi.fn();
    render(<Tile index={0} state="default" disabled={true} onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Tile 1" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

