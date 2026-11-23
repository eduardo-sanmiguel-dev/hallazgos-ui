import type { CSSProperties } from "react";

import { createAppTheme } from "../../theme";

// Los avisos (Sonner) siempre se ven claros, su tema por omisión. Sus textos
// de colores quedaban bajo AA sobre su fondo (advertencia 3.1:1, error y
// éxito 4.3:1): se usan los tonos del tema claro. Se aplican como variables en
// el <Toaster> (AppProviders), que ganan a las de la hoja de Sonner.
const { success, info, warning, error } = createAppTheme("light").palette;

export const TOAST_TEXT_COLORS = {
  "--success-text": success.dark,
  "--info-text": info.dark,
  "--warning-text": warning.main,
  "--error-text": error.dark,
} as const;

export const toastColorsStyle = TOAST_TEXT_COLORS as CSSProperties;

/** Fondos de Sonner con `richColors` en tema claro (sonner/dist/styles.css). */
export const SONNER_LIGHT_BACKGROUNDS = {
  "--success-text": "hsl(143, 85%, 96%)",
  "--info-text": "hsl(208, 100%, 97%)",
  "--warning-text": "hsl(49, 100%, 97%)",
  "--error-text": "hsl(359, 100%, 97%)",
} as const;
