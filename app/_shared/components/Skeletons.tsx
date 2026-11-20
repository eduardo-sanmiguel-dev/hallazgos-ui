import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Skeleton } from "@mui/material";
import { Stack } from "@mui/material";

import FormContainer from "./FormContainer";

// Esqueletos por tipo de pantalla: ocupan el lugar de lo que va a cargar para
// que la página no "salte" al llegar los datos.

function SkeletonRoot({ label = "Cargando…", children }: { label?: string; children: ReactNode }) {
  return (
    <Box component="output" aria-live="polite" aria-label={label}>
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
      <Paper variant="outlined" sx={{ p: 2, display: { xs: "none", sm: "block" } }}>
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
          <Paper key={section} variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
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

// Lista de conceptos evaluados (resultados de un recorrido o de una
// inspección): título de la categoría y renglones.
export function ChecklistSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ justifyContent: "space-between" }}>
        <Skeleton variant="text" width={140} height={28} />
        <Skeleton variant="text" width={80} />
      </Stack>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={72} />
      ))}
    </Stack>
  );
}

// Sección con título y contenido (como DetailSection).
function SectionSkeleton({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

// Detalle de un registro (p. ej. un recorrido): resumen, indicadores,
// resultados y, al lado, los datos. La cabecera ya está en pantalla. En
// celular, una columna.
export function DetailSkeleton() {
  return (
    <SkeletonRoot>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, md: 3 },
          alignItems: "start",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 2fr) minmax(0, 1fr)" },
          gridTemplateAreas: {
            xs: `"summary" "kpis" "results" "data"`,
            md: `"summary summary" "kpis kpis" "results data"`,
          },
        }}
      >
        <Box sx={{ gridArea: "summary" }}>
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" sx={{ width: { xs: "100%", sm: 420 } }} height={40} />
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Skeleton variant="rounded" width={150} height={24} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" width={120} height={24} sx={{ borderRadius: 4 }} />
          </Stack>
        </Box>
        <Box
          sx={{
            gridArea: "kpis",
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, 2fr) minmax(0, 1fr)" },
          }}
        >
          <Skeleton variant="rounded" height={112} />
          <Skeleton variant="rounded" height={112} />
        </Box>
        <Box sx={{ gridArea: "results", minWidth: 0 }}>
          <SectionSkeleton>
            <ChecklistSkeleton />
          </SectionSkeleton>
        </Box>
        <Box sx={{ gridArea: "data", minWidth: 0 }}>
          <SectionSkeleton>
            <Stack spacing={1.5}>
              {Array.from({ length: 6 }, (_, index) => (
                <Box key={index}>
                  <Skeleton variant="text" width={80} height={18} />
                  <Skeleton variant="text" width="70%" />
                </Box>
              ))}
            </Stack>
          </SectionSkeleton>
        </Box>
      </Box>
    </SkeletonRoot>
  );
}

// Gráfica sola (p. ej. una que carga sus propios datos).
export function ChartSkeleton({ height = 320, label }: { height?: number; label?: string }) {
  return (
    <SkeletonRoot label={label}>
      <Skeleton variant="rounded" height={height} />
    </SkeletonRoot>
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
