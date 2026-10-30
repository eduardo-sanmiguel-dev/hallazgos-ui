"use client";

export const dynamic = "force-dynamic";

import { ReactNode, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { ToggleButton } from "@mui/material";
import { ToggleButtonGroup } from "@mui/material";
import { Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import { alpha } from "@mui/material/styles";

import { GembaWalksService, parseApiError } from "@services";
import { GembaWalk } from "@interfaces";
import { stringToDateWithTime } from "@shared/utils";
import LoadingLinear from "@shared/components/LoadingLinear";
import EmptyState from "@shared/components/EmptyState";
import ErrorState from "@shared/components/ErrorState";
import StatusChip from "@shared/components/StatusChip";
import DetailSection, {
  DetailField,
  DetailFieldList,
} from "@shared/components/DetailSection";
import GembaWalkAccessGuard from "../_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import { groupByCategory } from "../_components/groupByCategory";
import { complianceOf } from "../_components/TableGembaWalks";
import { formatDuration } from "../_components/formatDuration";
import ComplianceMeter from "../_components/ComplianceMeter";

type Filter = "all" | "nonCompliant";

const BackButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={() => router.push("/gemba-walk")}
    >
      Regresar
    </Button>
  );
};

/** Indicador del resumen: etiqueta, valor grande y un detalle opcional. */
const Kpi = ({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "success" | "error";
}) => (
  <Paper
    variant="outlined"
    sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2, height: "100%" }}
  >
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", color: "text.secondary" }}
    >
      {icon}
      <Typography variant="body2">{label}</Typography>
    </Stack>
    <Typography
      component="p"
      variant="h3"
      sx={{
        fontWeight: 700,
        lineHeight: 1.2,
        mt: 0.5,
        fontSize: { xs: "2rem", sm: "3rem" },
        whiteSpace: "nowrap",
        color: tone ? `${tone}.main` : "text.primary",
      }}
    >
      {value}
    </Typography>
    {hint && (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {hint}
      </Typography>
    )}
  </Paper>
);

// Detalle de un recorrido, con la misma estructura que el de un hallazgo:
// resumen (dónde y de qué tipo), indicadores (cumplimiento con sus conteos y
// duración), resultados por categoría con filtro "Solo no cumple" y, al
// lado, los datos. En celular, una columna: resumen, indicadores,
// resultados y datos.
const GembaWalkDetail = () => {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id") || 0);
  const query = useQuery({
    queryKey: ["gemba-walk", "detail", id],
    queryFn: () => GembaWalksService.findOne(id),
    enabled: !!id,
  });
  const gembaWalk: GembaWalk | null = query.data ?? null;
  // Antes, si fallaba o no existía, la barra de carga quedaba para siempre (G5).
  const status: "loading" | "ready" | "notFound" | "error" = !id
    ? "notFound"
    : query.isFetching && !query.data
      ? "loading"
      : query.isError
        ? parseApiError(query.error).kind === "notFound"
          ? "notFound"
          : "error"
        : query.isSuccess
          ? "ready"
          : "loading";
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(
    () => groupByCategory(gembaWalk?.results || []),
    [gembaWalk],
  );

  if (status === "notFound") {
    return (
      <EmptyState
        title="Recorrido no encontrado"
        description="El enlace no corresponde a un recorrido registrado."
      >
        <BackButton />
      </EmptyState>
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        offline={typeof navigator !== "undefined" && !navigator.onLine}
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (status === "loading" || !gembaWalk) return <LoadingLinear />;

  const calendar = gembaWalk.gembaWalkCalendar;
  const zone = calendar.gembaWalkZone;
  const { compliant, nonCompliant } = complianceOf(gembaWalk);

  const visibleGroups = groups
    .map(({ category, items }) => ({
      category,
      total: items.length,
      compliantInGroup: items.filter(({ isCompliant }) => isCompliant).length,
      items:
        filter === "nonCompliant"
          ? items.filter(({ isCompliant }) => !isCompliant)
          : items,
    }))
    .filter(({ items }) => items.length > 0);

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gap: { xs: 2, md: 3 },
        alignItems: "start",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "minmax(0, 2fr) minmax(0, 1fr)",
        },
        gridTemplateAreas: {
          xs: `"summary" "kpis" "results" "data"`,
          md: `"summary summary" "kpis kpis" "results data"`,
        },
      }}
    >
      {/* Resumen */}
      <Box
        component="header"
        // Color propio: el layout pinta los <header> con otro tono.
        sx={{ gridArea: "summary", color: "text.primary" }}
      >
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1.5 }}
        >
          {zone.manufacturingPlant.name}
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
        >
          {zone.nameZone} - {zone.nameLocation}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          <StatusChip
            size="small"
            tone={calendar.isAdditional ? "info" : "success"}
            variant="outlined"
            label={
              calendar.isAdditional
                ? "Recorrido adicional"
                : "Recorrido regular"
            }
          />
          {/* Sin conceptos evaluados no hay nada que resumir. */}
          {compliant + nonCompliant > 0 && (
            <StatusChip
              size="small"
              tone={nonCompliant ? "error" : "success"}
              label={
                nonCompliant
                  ? `${nonCompliant} ${nonCompliant === 1 ? "concepto no cumple" : "conceptos no cumplen"}`
                  : "Todo cumple"
              }
            />
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ mt: 1.5, flexWrap: "wrap", color: "text.secondary" }}
        >
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <PersonOutlineIcon fontSize="small" aria-hidden />
            <Typography variant="body2">
              {gembaWalk.createdBy?.name || "Sin observador"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <EventOutlinedIcon fontSize="small" aria-hidden />
            <Typography variant="body2">
              Programado {stringToDateWithTime(calendar.scheduledAt)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Indicadores */}
      <Box
        sx={{
          gridArea: "kpis",
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(0, 2fr) minmax(0, 1fr)",
          },
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}
        >
          <ComplianceMeter compliant={compliant} nonCompliant={nonCompliant} />
        </Paper>
        <Kpi
          label="Duración"
          value={formatDuration(gembaWalk.durationSeconds)}
          icon={<TimerOutlinedIcon fontSize="small" />}
          hint={
            gembaWalk.startedAt
              ? "Desde el inicio hasta el registro"
              : "Sin hora de inicio"
          }
        />
      </Box>

      {/* Resultados */}
      <Box sx={{ gridArea: "results", minWidth: 0 }}>
        <DetailSection
          title="Resultados"
          action={
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, value: Filter | null) => value && setFilter(value)}
              aria-label="Mostrar resultados"
            >
              <ToggleButton value="all">
                Todos ({compliant + nonCompliant})
              </ToggleButton>
              <ToggleButton value="nonCompliant" color="error">
                No cumple ({nonCompliant})
              </ToggleButton>
            </ToggleButtonGroup>
          }
        >
          {!visibleGroups.length ? (
            filter === "nonCompliant" ? (
              <EmptyState
                size="small"
                title="Todo cumple"
                description="Ningún concepto quedó como «No cumple» en este recorrido."
              />
            ) : (
              <EmptyState
                size="small"
                title="Sin resultados"
                description="Este recorrido no tiene conceptos evaluados."
              />
            )
          ) : (
            <Stack spacing={3}>
              {visibleGroups.map(
                ({ category, items, total, compliantInGroup }) => (
                  <Box component="section" key={category}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        component="h4"
                        sx={{ fontWeight: 700, color: "text.brand" }}
                      >
                        {category}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {compliantInGroup} de {total} cumplen
                      </Typography>
                    </Stack>
                    <Stack
                      component="ul"
                      spacing={1.5}
                      sx={{ listStyle: "none", m: 0, p: 0 }}
                    >
                      {items.map((result) => (
                        <Stack
                          component="li"
                          key={result.id}
                          direction="row"
                          spacing={1.5}
                          sx={(theme) => ({
                            p: 1.5,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            // Lo que no cumple resalta al recorrer la lista.
                            backgroundColor: result.isCompliant
                              ? "transparent"
                              : alpha(theme.palette.error.main, 0.06),
                          })}
                        >
                          {result.isCompliant ? (
                            <CheckCircleIcon color="success" aria-hidden />
                          ) : (
                            <CancelIcon color="error" aria-hidden />
                          )}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              useFlexGap
                              sx={{
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700 }}
                              >
                                {result.area}
                              </Typography>
                              <StatusChip
                                size="small"
                                tone={result.isCompliant ? "success" : "error"}
                                label={
                                  result.isCompliant
                                    ? "C - Cumple"
                                    : "NC - No cumple"
                                }
                              />
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{ mt: 0.5, color: "text.secondary" }}
                            >
                              {result.description}
                            </Typography>
                            {result.comments && (
                              <Box
                                sx={{
                                  mt: 1,
                                  pl: 1.5,
                                  py: 0.5,
                                  borderLeft: 3,
                                  borderColor: result.isCompliant
                                    ? "divider"
                                    : "error.main",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  Comentarios
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: "pre-line",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {result.comments}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ),
              )}
            </Stack>
          )}
        </DetailSection>
      </Box>

      {/* Datos: fijo bajo la barra superior (con 24 quedaba debajo de ella),
          igual que en el detalle de un hallazgo. */}
      <Box
        sx={{
          gridArea: "data",
          minWidth: 0,
          position: { md: "sticky" },
          top: { md: 88 },
        }}
      >
        <DetailSection title="Datos">
          <DetailFieldList>
            <DetailField label="Planta">
              {zone.manufacturingPlant.name}
            </DetailField>
            <DetailField label="Zona">{zone.nameZone}</DetailField>
            <DetailField label="Ubicación">{zone.nameLocation}</DetailField>
            <DetailField label="Tipo">
              {calendar.isAdditional ? "Adicional" : "Regular"}
            </DetailField>
            <DetailField label="Programado">
              {stringToDateWithTime(calendar.scheduledAt)}
            </DetailField>
            <DetailField label="Inicio">
              {gembaWalk.startedAt
                ? stringToDateWithTime(gembaWalk.startedAt)
                : "—"}
            </DetailField>
            <DetailField label="Fin">
              {stringToDateWithTime(gembaWalk.performedAt)}
            </DetailField>
            <DetailField label="Duración">
              {formatDuration(gembaWalk.durationSeconds)}
            </DetailField>
            <DetailField label="Observador">
              {gembaWalk.createdBy?.name || "—"}
            </DetailField>
          </DetailFieldList>
        </DetailSection>
      </Box>
    </Box>
  );
};

// "Regresar" en la cabecera, junto al título (antes, al final de la página).
const GembaWalkViewPage = () => (
  <>
    <PageHeader title="Detalle del recorrido">
      <BackButton />
    </PageHeader>
    <GembaWalkAccessGuard>
      <GembaWalkDetail />
    </GembaWalkAccessGuard>
  </>
);

export default GembaWalkViewPage;
