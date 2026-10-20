import { DEFAULT_THEME, THEME_OPTIONS, THEME_STORAGE_KEY, applyTheme, isThemeName, readTheme } from "./theme";

describe("theme helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  });

  it("defines Neo-Brutalist as the default theme and exposes five selectable themes", () => {
    expect(DEFAULT_THEME).toBe("neo-brutalist");
    expect(THEME_OPTIONS).toHaveLength(5);
    expect(THEME_OPTIONS.map((option) => option.value)).toEqual([
      "neo-brutalist",
      "soft-minimal",
      "dark-focus",
      "playful-pastel",
      "glass-gradient",
    ]);
  });

  it("reads and validates the stored theme preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark-focus");
    expect(readTheme()).toBe("dark-focus");
    expect(isThemeName("dark-focus")).toBe(true);
    expect(isThemeName("unknown-theme")).toBe(false);

    window.localStorage.setItem(THEME_STORAGE_KEY, "invalid-theme");
    expect(readTheme()).toBe(DEFAULT_THEME);
  });

  it("applies the theme to the document root", () => {
    applyTheme("playful-pastel");

    expect(document.documentElement.getAttribute("data-theme")).toBe("playful-pastel");
    expect(document.documentElement.style.colorScheme).toBe("light");

    applyTheme("dark-focus");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
