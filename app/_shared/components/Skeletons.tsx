"use client";

import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Skeleton } from "@mui/material";
import { Stack } from "@mui/material";

import FormContainer from "./FormContainer";

// Esqueletos por tipo de pantalla: ocupan el lugar de lo que va a cargar para
// que la página no "salte" al llegar los datos.

function SkeletonRoot({
  label = "Cargando…",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <Box role="status" aria-live="polite" aria-label={label}>
      {children}
    </Box>
  );
}

// Título de la página y botones de la cabecera.
function HeaderSkeleton() {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}
    >
      <Skeleton variant="text" width={220} height={44} />
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" width={96} height={40} />
        <Skeleton variant="rounded" width={40} height={40} />
      </Stack>
    </Stack>
  );
}

// Filas de tabla (tablet y escritorio) o tarjetas (celular, como
// ResponsiveTable).
function TableRowsSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <Paper
        variant="outlined"
        sx={{ p: 2, display: { xs: "none", sm: "block" } }}
      >
        <Skeleton variant="rounded" height={40} sx={{ mb: 1.5 }} />
        <Stack spacing={1.25}>
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={36} />
          ))}
        </Stack>
      </Paper>
      <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
        {Array.from({ length: Math.min(rows, 4) }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={128} />
        ))}
      </Stack>
    </>
  );
}

// Solo la tabla: para la primera carga de una lista, cuya cabecera y filtros
// ya están en pantalla.
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonRoot>
      <TableRowsSkeleton rows={rows} />
    </SkeletonRoot>
  );
}

// Lista: cabecera, barra de filtros y filas de tabla.
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <SkeletonRoot>
      <HeaderSkeleton />
      <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
      <TableRowsSkeleton rows={rows} />
    </SkeletonRoot>
  );
}

// Formulario: secciones con campos en dos columnas y botones al pie.
export function FormSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <FormContainer>
      <SkeletonRoot>
        <HeaderSkeleton />
        {Array.from({ length: sections }, (_, section) => (
          <Paper
            key={section}
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
          >
            <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Array.from({ length: 4 }, (_, field) => (
                <Grid key={field} size={{ xs: 12, md: 6 }}>
                  <Skeleton variant="rounded" height={56} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        ))}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Skeleton variant="rounded" width={110} height={40} />
          <Skeleton variant="rounded" width={110} height={40} />
        </Stack>
      </SkeletonRoot>
    </FormContainer>
  );
}

// Dashboard: indicadores y gráficas.
export function DashboardSkeleton() {
  return (
    <SkeletonRoot>
      <HeaderSkeleton />
      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        {Array.from({ length: 4 }, (_, index) => (
          <Grid key={`kpi-${index}`} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Skeleton variant="rounded" height={96} />
          </Grid>
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <Grid key={`chart-${index}`} size={{ xs: 12, lg: 6 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        ))}
      </Grid>
    </SkeletonRoot>
  );
}
