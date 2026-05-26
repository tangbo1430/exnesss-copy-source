import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { exnessTheme } from "./exnessTheme";
import { exnessDarkTheme } from "./exnessDarkTheme";
import {
  ResolvedTheme,
  ThemeMode,
  applyThemeToDocument,
  getSystemTheme,
  readStoredThemeMode,
  resolveThemeMode,
  writeStoredThemeMode,
} from "./themeMode";

interface ThemeModeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredThemeMode());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolved = useMemo(() => resolveThemeMode(mode === "system" ? "system" : mode), [mode, systemTheme]);

  useEffect(() => {
    writeStoredThemeMode(mode);
    applyThemeToDocument(resolved);
  }, [mode, resolved]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const theme = resolved === "dark" ? exnessDarkTheme : exnessTheme;

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
}
