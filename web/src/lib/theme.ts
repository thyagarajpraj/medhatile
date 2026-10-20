export const THEME_STORAGE_KEY = "medhatile_theme";

export const THEME_OPTIONS = [
  { value: "neo-brutalist", label: "Neo-Brutalist" },
  { value: "soft-minimal", label: "Soft Minimal" },
  { value: "dark-focus", label: "Dark Focus" },
  { value: "playful-pastel", label: "Playful Pastel" },
  { value: "glass-gradient", label: "Glass & Gradient" },
] as const;

export type ThemeName = (typeof THEME_OPTIONS)[number]["value"];

export const DEFAULT_THEME: ThemeName = "neo-brutalist";

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === "string" && THEME_OPTIONS.some((option) => option.value === value);
}

export function readTheme(): ThemeName {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(storedTheme) ? storedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "dark-focus" ? "dark" : "light";
}
