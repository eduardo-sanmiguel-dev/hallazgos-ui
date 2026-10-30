import type { AppThemeName } from "./theme";

/*
 * TEMPORAL: Halloween 2026 (desde el 29/10/2026). Se quita a mano; no hay
 * nada programado que lo quite solo.
 *
 * Mientras FORCED_THEME tenga valor:
 * - Toda la app usa ese tema: el layout principal ((routes)/layout.tsx) y lo
 *   que va fuera de él (login, recuperar contraseña, 404), vía ThemeRegistry.
 * - No se muestra el selector de tema del header (es el único disponible).
 * - La preferencia de cada usuario (localStorage "colorMode": "light" |
 *   "dark" | "halloween") NO se lee ni se escribe: queda intacta en su
 *   dispositivo. Al quitar esto, cada quien vuelve al tema que tenía.
 *
 * VOLVER A LA NORMALIDAD (solo quitar el forzado; Halloween sigue elegible):
 *   FORCED_THEME = null. Nada más: vuelven el selector y "colorMode".
 *
 * ELIMINAR EL TEMA DE HALLOWEEN POR COMPLETO:
 * 1. Borrar este archivo y sus usos (buscar "FORCED_THEME"):
 *    app/(routes)/layout.tsx y app/ThemeRegistry.tsx.
 * 2. app/theme.tsx: quitar "halloween" de AppThemeName y APP_THEME_NAMES, y
 *    HALLOWEEN_PALETTE con su rama en paletteFor.
 * 3. app/_shared/components/ThemeSelector.tsx: quitar PumpkinIcon y la
 *    opción "halloween" (y el color especial del botón con halloween).
 * 4. app/(routes)/layout.tsx: quitar HalloweenSpider (import y uso) y la
 *    entrada "halloween" del mapa por appTheme (busca "[theme.appTheme]").
 *    Borrar app/_shared/components/HalloweenSpider.tsx.
 *    Ambientación (luna, cementerio, calabazas, cuervos, murciélagos,
 *    telaraña): borrar app/_shared/components/HalloweenDecor.tsx y sus usos
 *    (buscar "Halloween" en app/(routes)/layout.tsx y app/page.tsx): el
 *    fondo y lo que vuela en <main>, el `isolation` de <main>, la escena del
 *    espacio libre del header (dejar solo `<Box sx={{ flexGrow: 1 }} />`) y
 *    la telaraña del menú lateral; en el login, el fragmento <>…</> que
 *    envuelve al <Container>.
 * 5. Comentarios que lo mencionan: app/_shared/constants/semanticTones.ts.
 * 6. Pruebas: e2e/seasonal-theme.spec.ts (borrar), e2e/navigation.spec.ts
 *    (paso de Halloween y la araña), e2e/theme-color.spec.ts (caso
 *    halloween), e2e/unit/theme-contrast.spec.ts (casos halloween); quitar
 *    el `test.skip(!!FORCED_THEME, …)` de las pruebas del selector y de los
 *    temas claro/oscuro.
 * 7. Quien tenga guardado "colorMode" = "halloween" en su dispositivo: ya lo
 *    cubre el layout (isAppThemeName lo descarta y queda el claro); no hace
 *    falta migración.
 * Después: buscar "halloween" (sin distinguir mayúsculas) en app/ y e2e/;
 * no debe quedar nada. Correr typecheck, lint y las pruebas de tema.
 */
export const FORCED_THEME: AppThemeName | null = "halloween";
