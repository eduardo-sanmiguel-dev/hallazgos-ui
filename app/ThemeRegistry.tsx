import { useState, type ReactNode } from "react";
import createCache, { type Options as EmotionCacheOptions } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import ThemePreferenceProvider from "./ThemePreferenceProvider";

export default function ThemeRegistry({
  options,
  children,
}: {
  options: EmotionCacheOptions;
  children: ReactNode;
}) {
  const [cache] = useState(() => createCache(options));
  return (
    <CacheProvider value={cache}>
      <ThemePreferenceProvider>
        <CssBaseline />
        {children}
      </ThemePreferenceProvider>
    </CacheProvider>
  );
}
