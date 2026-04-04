import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Grid } from "./Grid";

afterEach(() => {
  cleanup();
});

describe("Grid", () => {
  it("shows selected, missed, and wrong markers in review phase", () => {
    render(
      <Grid
        gridSize={4}
        pattern={[0, 1]}
        userSelections={[0]}
        wrongSelections={[2]}
        phase="review"
        blinkAnswers={true}
        onTileClick={vi.fn()}
      />,
    );

    const tile1 = screen.getByRole("button", { name: "Tile 1" });
    const tile2 = screen.getByRole("button", { name: "Tile 2" });
    const tile3 = screen.getByRole("button", { name: "Tile 3" });

    expect(within(tile1).getByText("OK")).toBeInTheDocument();
    expect(within(tile2).getByText(".")).toBeInTheDocument();
    expect(within(tile3).getByText("X")).toBeInTheDocument();
    expect(tile1).toBeDisabled();
    expect(tile2).toBeDisabled();
    expect(tile3).toBeDisabled();
  });

  it("allows clicks only during recall phase", () => {
    const onTileClick = vi.fn();
    render(
      <Grid
        gridSize={4}
        pattern={[0]}
        userSelections={[]}
        wrongSelections={[]}
        phase="recall"
        onTileClick={onTileClick}
      />,
    );

    const tile1 = screen.getByRole("button", { name: "Tile 1" });
    expect(tile1).not.toBeDisabled();

    fireEvent.click(tile1);
    expect(onTileClick).toHaveBeenCalledWith(0);
  });

  it("blinks revealed pattern tiles during the reveal phase", () => {
    render(
      <Grid
        gridSize={4}
        pattern={[0, 1]}
        userSelections={[]}
        wrongSelections={[]}
        phase="reveal"
        blinkReveal={true}
        onTileClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Tile 1" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 2" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 3" })).not.toHaveClass("animate-tile-blink");
  });
});

