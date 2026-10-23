"use client";

import { useEffect, useId, useMemo, useState } from "react";

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

import type { BiEppEmployeeDetail } from "@interfaces";
import { DashboardService } from "@services";

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
  const [detail, setDetail] = useState<BiEppEmployeeDetail | null>(null);

  const employeeId = employee?.employeeId;

  useEffect(() => {
    if (!employeeId) return;
    let ignore = false;
    setDetail(null);
    DashboardService.findBusinessIntelligenceEppEmployee({
      employeeId,
      manufacturingPlantId,
      startDate,
      endDate,
    }).then((response) => {
      if (!ignore) setDetail(response);
    });
    return () => {
      ignore = true;
    };
  }, [employeeId, manufacturingPlantId, startDate, endDate]);

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

            <Box>
              <Typography
                variant="subtitle2"
                component="h3"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                Entregas del periodo
              </Typography>
              <TableContainer>
                <Table size="small" aria-label="Entregas del periodo">
                  <TableHead>
                    <TableRow>
                      {[
                        "Fecha",
                        "Equipo",
                        "Cant.",
                        "Entrega anterior",
                        "Frecuencia",
                        "Estado",
                        "Registró",
                      ].map((label) => (
                        <TableCell
                          key={label}
                          sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatIsoDate(delivery.date)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 220 }}>
                          {delivery.equipmentName}
                        </TableCell>
                        <TableCell>{formatNumber(delivery.quantity)}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {delivery.previousDelivery
                            ? formatIsoDate(delivery.previousDelivery)
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {delivery.frequencyDays
                            ? `Cada ${delivery.frequencyDays} días`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {delivery.outOfRange ? (
                            <Chip
                              size="small"
                              color="warning"
                              label={
                                delivery.daysEarly === null
                                  ? "Fuera de rango"
                                  : `Fuera de rango · ${delivery.daysEarly} días antes`
                              }
                            />
                          ) : (
                            <Chip
                              size="small"
                              variant="outlined"
                              label="En rango"
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {delivery.registeredBy ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
