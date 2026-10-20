"use client";

import { useEffect, useState } from "react";
import { cn } from "@/src/lib/cn";
import { DEFAULT_THEME, applyTheme, readTheme, THEME_OPTIONS, type ThemeName } from "@/src/lib/theme";

export function ThemeSelector({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = readTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleChange = (nextTheme: ThemeName) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);

    try {
      window.localStorage.setItem("medhatile_theme", nextTheme);
    } catch {
      // Ignore storage write failures.
    }
  };

  return (
    <label className={cn("flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm", className)}>
      <span className="sr-only">Choose a visual theme</span>
      <span aria-hidden="true">🎨</span>
      <select
        value={theme}
        onChange={(event) => handleChange(event.target.value as ThemeName)}
        aria-label="Choose a theme"
        className="min-w-[160px] cursor-pointer appearance-none bg-transparent pr-6 font-semibold text-slate-800 outline-none"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
