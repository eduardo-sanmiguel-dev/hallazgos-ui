"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
import { Chip } from "@mui/material";
import { Typography } from "@mui/material";
import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { Theme } from "@mui/material/styles";

import { GembaWalksService, parseApiError } from "@services";
import { GembaWalk } from "@interfaces";
import { stringToDateWithTime } from "@shared/utils";
import LoadingLinear from "@shared/components/LoadingLinear";
import EmptyState from "@shared/components/EmptyState";
import ErrorState from "@shared/components/ErrorState";
import GembaWalkAccessGuard from "../_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import { groupByCategory } from "../_components/groupByCategory";
import { complianceOf } from "../_components/TableGembaWalks";
import { formatDuration } from "../_components/formatDuration";

const textPrimary = { color: (theme: Theme) => theme.palette.text.primary };
const textSecondary = {
  color: (theme: Theme) => theme.palette.text.secondary,
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Typography variant="caption" sx={textSecondary}>
      {label}
    </Typography>
    <Typography variant="body1" sx={textPrimary}>
      {value}
    </Typography>
  </Grid>
);

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

const GembaWalkDetail = () => {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id") || 0);
  const [gembaWalk, setGembaWalk] = useState<GembaWalk | null>(null);
  // Antes, si fallaba o no existía, la barra de carga quedaba para siempre (G5).
  const [status, setStatus] = useState<
    "loading" | "ready" | "notFound" | "error"
  >(id ? "loading" : "notFound");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!id) {
      setStatus("notFound");
      return;
    }

    let ignore = false;
    setStatus("loading");
    GembaWalksService.findOne(id)
      .then((data) => {
        if (ignore) return;
        setGembaWalk(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        setStatus(
          parseApiError(error).kind === "notFound" ? "notFound" : "error",
        );
      });
    return () => {
      ignore = true;
    };
  }, [id, retryCount]);

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
        onRetry={() => setRetryCount((count) => count + 1)}
      />
    );
  }

  if (status === "loading" || !gembaWalk) return <LoadingLinear />;

  const zone = gembaWalk.gembaWalkCalendar.gembaWalkZone;
  const { compliant, nonCompliant, percent } = complianceOf(gembaWalk);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <InfoItem label="Planta" value={zone.manufacturingPlant.name} />
            <InfoItem
              label="Zona"
              value={`${zone.nameZone} - ${zone.nameLocation}`}
            />
            <InfoItem
              label="Programado"
              value={`${stringToDateWithTime(gembaWalk.gembaWalkCalendar.scheduledAt)}${gembaWalk.gembaWalkCalendar.isAdditional ? " (Adicional)" : ""}`}
            />
            <InfoItem
              label="Inicio"
              value={
                gembaWalk.startedAt
                  ? stringToDateWithTime(gembaWalk.startedAt)
                  : "-"
              }
            />
            <InfoItem
              label="Fin"
              value={stringToDateWithTime(gembaWalk.performedAt)}
            />
            <InfoItem
              label="Duración"
              value={formatDuration(gembaWalk.durationSeconds)}
            />
            <InfoItem
              label="Observador"
              value={gembaWalk.createdBy?.name || "-"}
            />
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={textSecondary}>
                Resultado
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip size="small" color="success" label={`C: ${compliant}`} />
                <Chip
                  size="small"
                  color={nonCompliant ? "error" : "default"}
                  label={`NC: ${nonCompliant}`}
                />
                <Chip size="small" variant="outlined" label={`${percent}%`} />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {groups.map(({ category, items }) => (
        <Grid size={{ xs: 12 }} key={category}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ mb: 2, color: "text.brand" }}
            >
              {category}
            </Typography>
            <Stack spacing={2}>
              {items.map((result) => (
                <Box
                  key={result.id}
                  sx={(theme) => ({
                    p: 2,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `6px solid ${
                      result.isCompliant
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }`,
                  })}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, ...textPrimary }}
                    >
                      {result.area}
                    </Typography>
                    <Chip
                      size="small"
                      color={result.isCompliant ? "success" : "error"}
                      label={
                        result.isCompliant ? "C - Cumple" : "NC - No cumple"
                      }
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, ...textSecondary }}>
                    {result.description}
                  </Typography>
                  {result.comments && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1, whiteSpace: "pre-line", ...textPrimary }}
                    >
                      <strong>Comentarios:</strong> {result.comments}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      ))}

      <Grid size={{ xs: 12, sm: 6, md: 2.5 }} sx={{ display: "grid" }}>
        <BackButton />
      </Grid>
    </Grid>
  );
};

const GembaWalkViewPage = () => (
  <>
    <PageHeader title="Detalle del recorrido" />
    <GembaWalkAccessGuard>
      <GembaWalkDetail />
    </GembaWalkAccessGuard>
  </>
);

export default GembaWalkViewPage;
