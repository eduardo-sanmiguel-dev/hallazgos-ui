"use client";

import { useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { Box, Grid, Paper, Skeleton } from "@mui/material";

import type { BiEppOutOfRange } from "@interfaces";
import { DashboardService } from "@services";

import OutOfRangeByEquipmentChart from "../charts/OutOfRangeByEquipmentChart";
import type { EmployeeRanking } from "../_lib/outOfRange";
import EmployeeOutOfRangeDialog from "./EmployeeOutOfRangeDialog";
import OutOfRangeRanking from "./OutOfRangeRanking";

interface Props {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
}

// Pestaña "Fuera de rango": qué equipos se entregan antes de tiempo, a quién
// y, por persona, qué equipos pide. El equipo elegido en la gráfica filtra el
// ranking (y viceversa con el selector del ranking).
export default function OutOfRangePanel({
  manufacturingPlantId,
  startDate,
  endDate,
}: Props) {
  const [chosenEquipmentId, setSelectedEquipmentId] = useState<number | null>(
    null,
  );
  const [employee, setEmployee] = useState<EmployeeRanking | null>(null);

  // Al cambiar planta o periodo se conserva lo anterior hasta tener lo nuevo.
  const query = useQuery({
    queryKey: [
      "business-intelligence",
      "epp-out-of-range",
      { manufacturingPlantId, startDate, endDate },
    ],
    queryFn: () =>
      DashboardService.findBusinessIntelligenceEppOutOfRange({
        manufacturingPlantId,
        startDate,
        endDate,
      }),
    enabled: !!manufacturingPlantId,
    placeholderData: keepPreviousData,
  });
  const data: BiEppOutOfRange | null = query.data ?? null;
  const isLoading = query.isFetching;
  // El equipo elegido puede no existir en otro periodo o planta.
  const selectedEquipmentId = data?.byEquipment.some(
    (row) => row.equipmentId === chosenEquipmentId,
  )
    ? chosenEquipmentId
    : null;

  if (!data) {
    return (
      <Grid container spacing={2}>
        {[320, 360].map((height) => (
          <Grid key={height} size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="rounded" height={height} sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box
      sx={{
        opacity: isLoading ? 0.55 : 1,
        transition: "opacity 0.2s ease",
      }}
      aria-busy={isLoading}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <OutOfRangeByEquipmentChart
            rows={data.byEquipment}
            selectedEquipmentId={selectedEquipmentId}
            onSelect={setSelectedEquipmentId}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <OutOfRangeRanking
            rows={data.byEmployeeEquipment}
            equipments={data.byEquipment}
            selectedEquipmentId={selectedEquipmentId}
            onSelectEquipment={setSelectedEquipmentId}
            onOpenEmployee={setEmployee}
          />
        </Grid>
      </Grid>

      <EmployeeOutOfRangeDialog
        employee={employee}
        manufacturingPlantId={manufacturingPlantId}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setEmployee(null)}
      />
    </Box>
  );
}
