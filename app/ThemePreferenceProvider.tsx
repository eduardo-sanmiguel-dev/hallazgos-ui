"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { createAppTheme, isThemePreference, ThemePreference } from "./theme";

const THEME_STORAGE_KEY = "colorMode";

const ThemePreferenceContext = createContext<{
  preference: ThemePreference;
  changePreference: (preference: ThemePreference) => void;
} | null>(null);

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) throw new Error("Se requiere ThemePreferenceProvider");
  return context;
}

export default function ThemePreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedTheme =
    preference === "system" ? (prefersDark ? "dark" : "light") : preference;
  const theme = useMemo(() => createAppTheme(resolvedTheme), [resolvedTheme]);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(saved)) setPreference(saved);
  }, []);

  const changePreference = (value: ThemePreference) => {
    setPreference(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  };

  return (
    <ThemePreferenceContext.Provider value={{ preference, changePreference }}>
      <ThemeProvider theme={theme}>
        <meta name="theme-color" content={theme.palette.background.paper} />
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}
