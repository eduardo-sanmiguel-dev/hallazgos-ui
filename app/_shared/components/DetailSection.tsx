import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface DetailSectionProps {
  title: string;
  // Texto corto bajo el título.
  description?: ReactNode;
  // A la derecha del título (un conteo, un filtro…).
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

// Sección de una vista de detalle o de captura (detalle de hallazgo, Gemba
// Walk): título (h3) y contenido, con el mismo acento que la barra de filtros
// con un filtro activo (borde y franja izquierda en el verde de marca).
export default function DetailSection({
  title,
  description,
  action,
  children,
  sx,
}: DetailSectionProps) {
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label={title}
      sx={[
        {
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          borderColor: "primary.main",
          boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.primary.main}`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          mb: description ? 0.5 : 2,
        }}
      >
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

/** Par etiqueta/valor de una lista de datos (`DetailFieldList`). */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="dt"
        variant="caption"
        sx={{ color: "text.secondary", display: "block" }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body2"
        sx={{ m: 0, overflowWrap: "anywhere" }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/**
 * Lista de datos (dl) en dos columnas; en una columna lateral angosta
 * (escritorio mediano), en una.
 */
export function DetailFieldList({ children }: { children: ReactNode }) {
  return (
    <Box
      component="dl"
      sx={{
        m: 0,
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "minmax(0, 1fr)",
          lg: "repeat(2, minmax(0, 1fr))",
        },
      }}
    >
      {children}
    </Box>
  );
}
