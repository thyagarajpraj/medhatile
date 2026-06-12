import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GameRouteSelect } from "./GameRouteSelect";

const push = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => mockPathname,
}));

describe("GameRouteSelect", () => {
  beforeEach(() => {
    push.mockReset();
    mockPathname = "/";
  });

  it("shows the current route in the dropdown", () => {
    mockPathname = "/games/adding";

    render(<GameRouteSelect />);

    expect(screen.getByRole("combobox", { name: "Choose a tile game" })).toHaveValue("/games/adding");
  });

  it("navigates to the selected game route", () => {
    mockPathname = "/";

    render(<GameRouteSelect />);

    fireEvent.change(screen.getByRole("combobox", { name: "Choose a tile game" }), {
      target: { value: "/games/identifying" },
    });

    expect(push).toHaveBeenCalledWith("/games/identifying");
  });
});
