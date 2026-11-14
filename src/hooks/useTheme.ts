import { useState, useEffect, useCallback } from "react";

export type TovuTheme = "dark" | "light";

const THEME_STORAGE_KEY = "tovu_theme";

function getInitialTheme(): TovuTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  return "dark";
}

function applyThemeToDocument(theme: TovuTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<TovuTheme>(getInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((next: TovuTheme) => {
    setThemeState(next);
  }, []);

  return { theme, setTheme, toggleTheme };
}
