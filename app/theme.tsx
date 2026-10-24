import { alpha, createTheme, darken } from "@mui/material/styles";
import type { Theme, ThemeOptions } from "@mui/material/styles";

// Color de marca (verde HADA). Es el único color fijo del sistema; todo lo
// demás se deriva del theme.
export const BRAND_PRIMARY = "#71BF44";

// Temas que el usuario puede elegir en el header.
export type AppThemeName = "light" | "dark" | "halloween";

export const APP_THEME_NAMES: readonly AppThemeName[] = [
  "light",
  "dark",
  "halloween",
];

export const isAppThemeName = (value: unknown): value is AppThemeName =>
  APP_THEME_NAMES.includes(value as AppThemeName);

// Halloween es un tema oscuro: gráficas, logo y demás piezas que revisan
// `palette.mode` se adaptan solas. Calabaza, morado y fondo de noche.
const HALLOWEEN_PALETTE: ThemeOptions["palette"] = {
  mode: "dark",
  primary: {
    main: "#FF7A1A",
    light: "#FFA057",
    dark: "#D45A00",
    contrastText: "#1A0F00",
  },
  secondary: {
    main: "#A66BFF",
    light: "#C29BFF",
    dark: "#7A3FD6",
    contrastText: "#0F0816",
  },
  background: {
    default: "#120C1A",
    paper: "#1C1426",
  },
  text: {
    primary: "#F6EBDD",
    secondary: "rgba(246, 235, 221, 0.72)",
  },
  divider: "rgba(255, 122, 26, 0.18)",
};

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
    appTheme: AppThemeName;
  }
  interface ThemeOptions {
    tokens?: DesignTokens;
    appTheme?: AppThemeName;
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
  alpha(
    theme.palette.primary.main,
    theme.palette.mode === "light" ? 0.12 : 0.2,
  );

export const createAppTheme = (appTheme: AppThemeName) =>
  createTheme({
    tokens,
    appTheme,
    palette:
      appTheme === "halloween"
        ? HALLOWEEN_PALETTE
        : {
            mode: appTheme,
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
          // Con viewport-fit=cover (app/layout.tsx), en horizontal la página
          // podría quedar bajo el recorte de la cámara: se respeta a los lados.
          body: {
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
          },
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
          // A pantalla completa, lo último no queda detrás de los botones del
          // sistema (viewport-fit=cover en app/layout.tsx).
          paperFullScreen: {
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
          // En celular y tablet, menos relleno: las filas medían 70-110 px.
          sizeMedium: ({ theme }) => ({
            [theme.breakpoints.down("md")]: {
              padding: "10px 12px",
            },
          }),
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          // En celular, la paginación va en la última fila de una tabla que
          // se desplaza de lado: se queda fija a la izquierda, del ancho de
          // la pantalla, y baja a dos líneas en vez de cortarse.
          // En tablet pasa lo mismo con tablas anchas (márgenes de 24 px).
          toolbar: ({ theme }) => ({
            [theme.breakpoints.down("md")]: {
              position: "sticky",
              left: 0,
              maxWidth: "calc(100vw - 48px)",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              rowGap: 4,
              paddingLeft: 8,
              paddingRight: 8,
            },
            [theme.breakpoints.down("sm")]: {
              maxWidth: "calc(100vw - 32px)",
            },
          }),
          spacer: ({ theme }) => ({
            [theme.breakpoints.down("md")]: { display: "none" },
          }),
        },
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
