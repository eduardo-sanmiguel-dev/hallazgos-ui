"use client";

import {
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { MainTypesGlobalTrendDetailsZone } from "@interfaces";
import {
  formatMetric,
  formatPercentage,
  getComplianceColor,
  getComplianceLevel,
  getTrendIcon,
} from "./mainTypesGlobalTrend.helpers";

interface MainTypesZonesTabProps {
  detailTab: number;
  isZoneLoading: boolean;
  sortedZoneCards: MainTypesGlobalTrendDetailsZone[];
  avgZoneComplianceCurrent: number;
}

/** Pestaña "Cumplimiento por zona" del tipo seleccionado; el estado vive en MainTypesGlobalTrendAdmin. */
export const MainTypesZonesTab = ({
  detailTab,
  isZoneLoading,
  sortedZoneCards,
  avgZoneComplianceCurrent,
}: MainTypesZonesTabProps) => (
  <Box role="tabpanel" hidden={detailTab !== 0}>
    {detailTab === 0 && (
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="h6">Cumplimiento por zona </Typography>
          {!!sortedZoneCards.length && (
            <Chip
              label={`Promedio cumplimiento mes actual: ${formatPercentage(avgZoneComplianceCurrent.toFixed(1))}`}
              color={getComplianceColor(avgZoneComplianceCurrent)}
              size="small"
            />
          )}
        </Stack>

        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {isZoneLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <Grid
                  key={`zone-summary-skeleton-${index}`}
                  size={{ xs: 12, sm: 6, xl: 3 }}
                >
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.25}>
                      <Skeleton variant="text" height={30} width="55%" />
                      <Skeleton variant="text" height={38} width="40%" />
                      <Skeleton variant="text" height={20} width="85%" />
                      <Skeleton variant="rounded" width={170} height={28} />
                    </Stack>
                  </Paper>
                </Grid>
              ))
            : sortedZoneCards.map((item) => (
                <Grid key={item.zona} size={{ xs: 12, sm: 6, xl: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: "100%",
                      borderColor: "divider",
                      bgcolor: "background.default",
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {item.zona}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontSize: { xs: 30, md: 34 } }}
                      >
                        {formatMetric(item.total_hallazgos)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`Cerradas: ${formatMetric(item.cerradas)} · Abiertas: ${formatMetric(item.abiertas)} · Canceladas: ${formatMetric(item.canceladas)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`Criticos +90 dias: ${formatMetric(item.criticos_mas_90_dias)} · Promedio dias: ${formatMetric(item.promedio_dias_resolucion)}`}
                      </Typography>
                      <Chip
                        size="small"
                        icon={getTrendIcon(item.pct_cumplimiento_mes_actual)}
                        label={`Mes actual: ${formatPercentage(item.pct_cumplimiento_mes_actual)} · Nivel ${getComplianceLevel(item.pct_cumplimiento_mes_actual)}`}
                        color={getComplianceColor(
                          item.pct_cumplimiento_mes_actual,
                        )}
                        variant="filled"
                        sx={{ alignSelf: "flex-start" }}
                      />
                      <Chip
                        size="small"
                        label={`Historico: ${formatPercentage(item.pct_cumplimiento_historico)} · Mes anterior: ${formatPercentage(item.pct_cumplimiento_mes_anterior)}`}
                        variant="outlined"
                        sx={{ alignSelf: "flex-start" }}
                      />
                    </Stack>
                  </Paper>
                </Grid>
              ))}

          {!isZoneLoading && !sortedZoneCards.length && (
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">
                  No hay informacion de cumplimiento por zona para el tipo
                  seleccionado.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Stack>
    )}
  </Box>
);
