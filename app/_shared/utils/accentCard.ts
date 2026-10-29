import type { Theme } from "@mui/material/styles";

// Mismo acento que `DetailSection` y la barra de filtros con un filtro
// activo: borde y franja izquierda en el verde de marca. Para indicadores y
// tarjetas de gráficas de los tableros.
export const accentCard = (theme: Theme) => ({
  borderRadius: 2,
  borderColor: theme.palette.primary.main,
  boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
});
