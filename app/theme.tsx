import { alpha, createTheme, darken } from "@mui/material/styles";
import type { PaletteMode, Theme } from "@mui/material/styles";

// Color de marca (verde HADA). Es el único color fijo del sistema; todo lo
// demás se deriva del theme.
export const BRAND_PRIMARY = "#71BF44";

// Radios y transiciones propios del sistema de diseño. `shape.borderRadius`
// se deja en el valor por defecto (4) porque los `sx={{ borderRadius: n }}`
// existentes lo multiplican.
const tokens = {
  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
  },
  transition: {
    fast: 150,
  },
} as const;

type DesignTokens = typeof tokens;

declare module "@mui/material/styles" {
  interface Theme {
    tokens: DesignTokens;
  }
  interface ThemeOptions {
    tokens?: DesignTokens;
  }
}

// Texto o ícono en color primario que cumple contraste AA: en modo claro el
// verde de marca se oscurece (sobre blanco solo llega a ~2.3:1).
export const primaryTextColor = (theme: Theme) =>
  theme.palette.mode === "light"
    ? darken(theme.palette.primary.main, 0.45)
    : theme.palette.primary.light;

// Fondo tenue en color primario (item activo del menú, encabezados de tabla).
export const primarySoftBackground = (theme: Theme) =>
  alpha(theme.palette.primary.main, theme.palette.mode === "light" ? 0.12 : 0.2);

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    tokens,
    palette: {
      mode,
      primary: {
        main: BRAND_PRIMARY,
      },
    },
    typography: {
      h4: { fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme: Theme) => ({
          // Foco visible con teclado en botones, links e items. `:where()` deja
          // la especificidad baja para que los estilos de cada componente manden.
          ":where(.MuiButtonBase-root).Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        }),
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.md,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: {
            borderRadius: tokens.radius.lg,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.md,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.sm,
            fontWeight: 500,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.radius.xl,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
          },
        },
      },
      MuiTablePagination: {
        defaultProps: {
          labelRowsPerPage: "Filas por página",
          labelDisplayedRows: ({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`,
          getItemAriaLabel: (type) =>
            ({
              first: "Primera página",
              last: "Última página",
              next: "Página siguiente",
              previous: "Página anterior",
            })[type],
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: "0.8125rem",
          },
        },
      },
    },
  });

// Theme del layout raíz (login y páginas públicas), en modo claro.
const theme = createAppTheme("light");

export default theme;
