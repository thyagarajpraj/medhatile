import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GameRouteSelect } from "./GameRouteSelect";

/**
 * Renders the shared game switcher with a visible route marker for navigation tests.
 */
function renderGameRouteSelect(initialEntry = "/") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <GameRouteSelect />
      <Routes>
        <Route path="/" element={<div>Choose Game Page</div>} />
        <Route path="/games/adding" element={<div>2048 Page</div>} />
        <Route path="/games/identifying" element={<div>Identifying Tiles Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GameRouteSelect", () => {
  it("shows the current route in the dropdown", () => {
    renderGameRouteSelect("/games/adding");

    expect(screen.getByRole("combobox", { name: "Choose a tile game" })).toHaveValue("/games/adding");
    expect(screen.getByText("2048 Page")).toBeInTheDocument();
  });

  it("navigates to the selected game route", () => {
    renderGameRouteSelect("/");

    fireEvent.change(screen.getByRole("combobox", { name: "Choose a tile game" }), {
      target: { value: "/games/identifying" },
    });

    expect(screen.getByText("Identifying Tiles Page")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Choose a tile game" })).toHaveValue("/games/identifying");
  });
});
