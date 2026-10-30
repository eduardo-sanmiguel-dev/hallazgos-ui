"use client";

import { useId, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

import type { BiEppEmployeeDetail } from "@interfaces";
import { DashboardService } from "@services";
import StatusChip from "@shared/components/StatusChip";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";

import ChartCard from "./ChartCard";
import {
  formatIsoDate,
  formatNumber,
  periodLabel,
  useBiColors,
} from "../_lib/biEpp";
import type { EmployeeRanking } from "../_lib/outOfRange";

interface Props {
  // Colaborador del ranking; null cierra el diálogo.
  employee: EmployeeRanking | null;
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

// Detalle de un colaborador: qué equipos pide fuera de rango y cada entrega
// del periodo (cuánto antes de tiempo y quién la registró).
export default function EmployeeOutOfRangeDialog({
  employee,
  manufacturingPlantId,
  startDate,
  endDate,
  onClose,
}: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const colors = useBiColors();
  const titleId = useId();
  const employeeId = employee?.employeeId;

  // Otro colaborador: vacío hasta tener su detalle (sin mostrar el anterior).
  const { data: detail = null } = useQuery<BiEppEmployeeDetail>({
    queryKey: [
      "business-intelligence",
      "epp-employee",
      { employeeId, manufacturingPlantId, startDate, endDate },
    ],
    queryFn: () =>
      DashboardService.findBusinessIntelligenceEppEmployee({
        employeeId: employeeId!,
        manufacturingPlantId,
        startDate,
        endDate,
      }),
    enabled: !!employeeId,
  });

  // Equipos que pide fuera de rango, de más a menos.
  const byEquipment = useMemo(() => {
    const counts = new Map<string, number>();
    for (const delivery of detail?.deliveries ?? []) {
      if (!delivery.outOfRange) continue;
      counts.set(
        delivery.equipmentName,
        (counts.get(delivery.equipmentName) ?? 0) + 1,
      );
    }
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [detail]);

  const outOfRange = detail?.deliveries.filter((d) => d.outOfRange).length;

  return (
    <Dialog
      open={!!employee}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      // Ancho: la tabla de entregas tiene 7 columnas.
      maxWidth="lg"
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId} sx={{ pr: 6 }}>
        {employee?.name}
        <Typography variant="body2" color="text.secondary">
          {[
            employee?.code && `Cédula ${employee.code}`,
            employee?.area,
            employee?.position,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      </DialogTitle>
      <IconButton
        aria-label="Cerrar"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent dividers>
        {!detail ? (
          <Stack spacing={1.5}>
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={160} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2">
              <b>{formatNumber(outOfRange ?? 0)}</b> de{" "}
              {formatNumber(detail.deliveries.length)} entregas fuera de rango
              en {periodLabel(detail.periodo)}.
            </Typography>

            <ChartCard
              title="Equipos que más pide fuera de rango"
              isEmpty={!byEquipment.length}
              emptyText="Ninguna entrega fuera de rango en el periodo."
              height={Math.max(160, byEquipment.length * 40 + 50)}
              options={{
                chart: { type: "bar" },
                legend: { enabled: false },
                xAxis: { categories: byEquipment.map(({ name }) => name) },
                yAxis: { min: 0, allowDecimals: false },
                plotOptions: { series: { dataLabels: { enabled: true } } },
                series: [
                  {
                    type: "bar",
                    name: "Fuera de rango",
                    color: colors.alert,
                    data: byEquipment.map(({ count }) => count),
                  },
                ],
              }}
              table={{
                columns: [
                  { label: "Equipo" },
                  { label: "Fuera de rango", numeric: true },
                ],
                rows: byEquipment.map(({ name, count }) => [
                  name,
                  formatNumber(count),
                ]),
              }}
            />

            <Box component="section" aria-labelledby={`${titleId}-entregas`}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", mb: 1 }}
              >
                <Typography
                  id={`${titleId}-entregas`}
                  variant="subtitle1"
                  component="h3"
                  sx={{ fontWeight: 600 }}
                >
                  Entregas del periodo
                </Typography>
                <StatusChip
                  size="small"
                  variant="outlined"
                  label={formatNumber(detail.deliveries.length)}
                />
              </Stack>
              {/* Como las tablas del sistema; en celular (diálogo a pantalla
                  completa), tarjetas en lugar de 7 columnas de lado. */}
              {fullScreen ? (
                <Stack
                  component="ul"
                  aria-label="Entregas del periodo"
                  spacing={1}
                  sx={{ listStyle: "none", m: 0, p: 0 }}
                >
                  {detail.deliveries.map((delivery) => (
                    <Paper
                      key={delivery.id}
                      component="li"
                      variant="outlined"
                      sx={(theme) => ({
                        p: 1.5,
                        borderLeft: `4px solid ${
                          delivery.outOfRange
                            ? theme.palette.warning.main
                            : theme.palette.success.main
                        }`,
                      })}
                    >
                      <Typography sx={{ fontWeight: 600 }}>
                        {delivery.equipmentName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatIsoDate(delivery.date)} · Cant.{" "}
                        {formatNumber(delivery.quantity)}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <DeliveryStatus delivery={delivery} />
                      </Box>
                      <Typography
                        variant="caption"
                        component="p"
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                      >
                        {[
                          `Anterior: ${delivery.previousDelivery ? formatIsoDate(delivery.previousDelivery) : "—"}`,
                          delivery.frequencyDays &&
                            `cada ${delivery.frequencyDays} días`,
                          delivery.registeredBy &&
                            `registró ${delivery.registeredBy}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" aria-label="Entregas del periodo">
                    <TableHead>
                      <StyledTableRow>
                        {[
                          "Fecha",
                          "Equipo",
                          "Cant.",
                          "Entrega anterior",
                          "Frecuencia",
                          "Estado",
                          "Registró",
                        ].map((label) => (
                          <StyledTableCell
                            key={label}
                            align={label === "Cant." ? "right" : "left"}
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {label}
                          </StyledTableCell>
                        ))}
                      </StyledTableRow>
                    </TableHead>
                    <TableBody>
                      {detail.deliveries.map((delivery) => (
                        <StyledTableRow key={delivery.id}>
                          <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                            {formatIsoDate(delivery.date)}
                          </StyledTableCell>
                          <StyledTableCell
                            component="th"
                            scope="row"
                            sx={{ minWidth: 200, fontWeight: 600 }}
                          >
                            {delivery.equipmentName}
                          </StyledTableCell>
                          <StyledTableCell
                            align="right"
                            sx={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {formatNumber(delivery.quantity)}
                          </StyledTableCell>
                          <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                            {delivery.previousDelivery
                              ? formatIsoDate(delivery.previousDelivery)
                              : "—"}
                          </StyledTableCell>
                          <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                            {delivery.frequencyDays
                              ? `Cada ${delivery.frequencyDays} días`
                              : "—"}
                          </StyledTableCell>
                          <StyledTableCell>
                            <DeliveryStatus delivery={delivery} />
                          </StyledTableCell>
                          <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                            {delivery.registeredBy ?? "—"}
                          </StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Estado de una entrega, con los tonos del sistema (`StatusChip`). */
function DeliveryStatus({
  delivery,
}: {
  delivery: BiEppEmployeeDetail["deliveries"][number];
}) {
  return delivery.outOfRange ? (
    <StatusChip
      size="small"
      tone="warning"
      label={
        delivery.daysEarly === null
          ? "Fuera de rango"
          : `Fuera de rango · ${delivery.daysEarly} días antes`
      }
    />
  ) : (
    <StatusChip
      size="small"
      tone="success"
      variant="outlined"
      label="En rango"
    />
  );
}
