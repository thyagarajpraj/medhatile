import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeSelector } from "./ThemeSelector";
import { DEFAULT_THEME, THEME_OPTIONS } from "@/src/lib/theme";

describe("ThemeSelector", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  it("renders the default theme and all theme choices", () => {
    render(<ThemeSelector />);

    const select = screen.getByRole("combobox", { name: "Choose a theme" });
    expect(select).toHaveValue(DEFAULT_THEME);
    expect(Array.from(select.options).map((option) => option.value)).toEqual(THEME_OPTIONS.map((option) => option.value));
  });

  it("applies the selected theme and persists it to localStorage", () => {
    render(<ThemeSelector />);

    fireEvent.change(screen.getByRole("combobox", { name: "Choose a theme" }), {
      target: { value: "glass-gradient" },
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("glass-gradient");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem("medhatile_theme")).toBe("glass-gradient");
  });
});
