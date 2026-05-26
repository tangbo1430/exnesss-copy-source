export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_MODE_STORAGE_KEY = "exness-theme-mode";

export function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function writeStoredThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  return mode === "system" ? getSystemTheme() : mode;
}

export function applyThemeToDocument(resolved: ResolvedTheme) {
  document.documentElement.setAttribute("data-theme", resolved);
}
