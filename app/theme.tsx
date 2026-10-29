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
  interface TypeText {
    // Color de marca para texto e íconos: `sx={{ color: "text.brand" }}`.
    brand: string;
  }
}

// Pantallas táctiles (celular, tablet). Las áreas táctiles crecen solo aquí
// para no cambiar el escritorio, donde se usa mouse.
export const TOUCH_MEDIA = "@media (pointer: coarse)";

// Mínimos de área táctil en pantallas táctiles (A2 de docs/ux-auditoria.md).
const touchTarget = {
  small: 44,
  medium: 48,
} as const;

// Advertencia e info de MUI con texto blanco quedan en 3.1:1 y 3.9:1; estos
// tonos cumplen AA (5.0:1 y 4.8:1) como relleno y como texto sobre blanco.
const LIGHT_SEMANTIC_PALETTE: ThemeOptions["palette"] = {
  warning: { main: "#B45309" },
  info: { main: "#0277BD" },
};

// Texto o ícono en color primario que cumple contraste AA: en modo claro el
// verde de marca se oscurece (sobre blanco solo llega a ~2.3:1).
export const primaryTextColor = (theme: Theme) =>
  theme.palette.mode === "light"
    ? darken(theme.palette.primary.main, 0.45)
    : theme.palette.primary.light;

// Fondo tenue en color primario de los encabezados (tablas y barra del
// detalle de hallazgo). 16 % en claro y 24 % en oscuro: con su texto
// (`primaryTextColor`) da 5.7:1 o más en los tres temas.
export const primarySoftBackground = (theme: Theme) =>
  alpha(
    theme.palette.primary.main,
    theme.palette.mode === "light" ? 0.16 : 0.24,
  );

// Línea de acento bajo esos encabezados: da presencia de marca sin un relleno
// fuerte (que competiría con los botones principales). Es decorativa: el
// fondo ya delimita el encabezado.
export const primaryAccentBorder = (theme: Theme) =>
  `2px solid ${theme.palette.primary.main}`;

// En modo claro, el texto y los íconos en color primario usan el verde oscuro;
// los rellenos (botón contained, chip filled) y el logo conservan el de marca.
const brandTextOnLight = ({ theme }: { theme: Theme }) =>
  theme.palette.mode === "light" ? { color: theme.palette.text.brand } : {};

// Texto e íconos rojos en los temas oscuros: el rojo de error de MUI
// (#f44336) sobre los campos da 4.37:1 y sobre el papel de los diálogos
// (más claro por la elevación) 3.18:1. Este tono da 7.05:1 y 5.14:1. Los
// rellenos y bordes conservan el de MUI.
export const ERROR_TEXT_ON_DARK = "#ff8a80";

const errorTextOnDark = ({ theme }: { theme: Theme }) =>
  theme.palette.mode === "dark" ? { color: ERROR_TEXT_ON_DARK } : {};

const paletteFor = (appTheme: AppThemeName): ThemeOptions["palette"] =>
  appTheme === "halloween"
    ? HALLOWEEN_PALETTE
    : appTheme === "light"
      ? {
          mode: "light",
          primary: { main: BRAND_PRIMARY },
          ...LIGHT_SEMANTIC_PALETTE,
        }
      : { mode: "dark", primary: { main: BRAND_PRIMARY } };

export const createAppTheme = (appTheme: AppThemeName) => {
  const theme = createTheme(appThemeOptions(appTheme));
  // Se calcula sobre la paleta ya resuelta (en oscuro usa primary.light, que
  // MUI deriva del principal).
  theme.palette.text.brand = primaryTextColor(theme);
  return theme;
};

const appThemeOptions = (appTheme: AppThemeName): ThemeOptions => ({
  tokens,
  appTheme,
  palette: paletteFor(appTheme),
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
        root: ({ theme }) => ({
          borderRadius: tokens.radius.md,
          [TOUCH_MEDIA]: { minHeight: touchTarget.medium },
          variants: [
            {
              props: { size: "small" },
              style: { [TOUCH_MEDIA]: { minHeight: touchTarget.small } },
            },
            {
              props: { color: "primary", variant: "text" },
              style: brandTextOnLight({ theme }),
            },
            {
              props: { color: "primary", variant: "outlined" },
              style: brandTextOnLight({ theme }),
            },
            // Contorno con el fondo del papel: transparente, sobre el fondo
            // gris de la página solo se veía el borde verde claro y el botón
            // se perdía ("Regresar", "Usar cámara del navegador"). Sobre una
            // tarjeta no cambia nada. Al pasar el mouse, un tono encima.
            {
              props: { variant: "outlined" },
              style: {
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  backgroundColor: theme.palette.background.paper,
                  backgroundImage: `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`,
                },
              },
            },
            {
              props: { color: "error", variant: "text" },
              style: errorTextOnDark({ theme }),
            },
            {
              props: { color: "error", variant: "outlined" },
              style: errorTextOnDark({ theme }),
            },
            // En oscuro, al pasar el mouse el relleno se aclara: oscurecido
            // (lo de MUI) su texto quedaba en 4.3:1.
            ...(theme.palette.mode === "dark"
              ? [
                  {
                    props: { color: "primary", variant: "contained" },
                    style: {
                      "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                      },
                    },
                  } as const,
                ]
              : []),
          ],
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          [TOUCH_MEDIA]: {
            minWidth: touchTarget.medium,
            minHeight: touchTarget.medium,
            // Dentro de un campo (calendario, ver contraseña, abrir lista)
            // no crece: el campo completo ya es el área táctil.
            ".MuiInputBase-root &": { minWidth: "auto", minHeight: "auto" },
          },
          variants: [
            {
              props: { size: "small" },
              style: {
                [TOUCH_MEDIA]: {
                  minWidth: touchTarget.small,
                  minHeight: touchTarget.small,
                },
              },
            },
            {
              props: { color: "primary" },
              style: brandTextOnLight({ theme }),
            },
            {
              props: { color: "error" },
              style: errorTextOnDark({ theme }),
            },
          ],
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { [TOUCH_MEDIA]: { minHeight: touchTarget.medium } },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { [TOUCH_MEDIA]: { minHeight: touchTarget.medium } },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          [TOUCH_MEDIA]: { minHeight: touchTarget.small },
          variants: [
            {
              props: { color: "primary" },
              style: {
                "&.Mui-selected": brandTextOnLight({ theme }),
              },
            },
            {
              props: { color: "error" },
              style: { "&.Mui-selected": errorTextOnDark({ theme }) },
            },
          ],
        }),
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: ({ theme }) => ({
          // 24 px de ícono + 12 px por lado = 48 px.
          [TOUCH_MEDIA]: { padding: 12 },
          variants: [
            {
              props: { color: "primary" },
              style: { "&.Mui-checked": brandTextOnLight({ theme }) },
            },
          ],
        }),
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: ({ theme }) => ({
          [TOUCH_MEDIA]: { padding: 12 },
          variants: [
            {
              props: { color: "primary" },
              style: { "&.Mui-checked": brandTextOnLight({ theme }) },
            },
          ],
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { textColor: "primary" },
              style: { "&.Mui-selected": brandTextOnLight({ theme }) },
            },
          ],
        }),
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { color: "primary" },
              style: { "&.Mui-focused": brandTextOnLight({ theme }) },
            },
          ],
          "&.Mui-error": errorTextOnDark({ theme }),
        }),
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-error": errorTextOnDark({ theme }),
        }),
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { color: "primary" },
              style:
                theme.palette.mode === "light"
                  ? {
                      color: theme.palette.text.brand,
                      textDecorationColor: alpha(theme.palette.text.brand, 0.4),
                    }
                  : {},
            },
          ],
        }),
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { color: "primary" },
              style: brandTextOnLight({ theme }),
            },
            {
              props: { color: "error" },
              style: errorTextOnDark({ theme }),
            },
          ],
        }),
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          variants: [
            {
              props: { color: "primary" },
              style: brandTextOnLight({ theme }),
            },
          ],
        }),
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
        root: ({ theme }) => ({
          borderRadius: tokens.radius.sm,
          fontWeight: 500,
          // Chips que se tocan (acciones de fila, estatus que abre el
          // detalle): mismo mínimo que un botón chico.
          [TOUCH_MEDIA]: {
            "&.MuiChip-clickable, &.MuiChip-deletable": {
              height: touchTarget.small,
            },
          },
          variants: [
            {
              props: { color: "primary", variant: "outlined" },
              style: {
                ...brandTextOnLight({ theme }),
                "& .MuiChip-icon": brandTextOnLight({ theme }),
              },
            },
          ],
        }),
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
