"use client";

import { useEffect, useState } from "react";

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
  const [data, setData] = useState<BiEppOutOfRange | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(
    null,
  );
  const [employee, setEmployee] = useState<EmployeeRanking | null>(null);

  useEffect(() => {
    if (!manufacturingPlantId) return;
    let ignore = false;
    setIsLoading(true);
    DashboardService.findBusinessIntelligenceEppOutOfRange({
      manufacturingPlantId,
      startDate,
      endDate,
    })
      .then((response) => {
        if (ignore) return;
        setData(response);
        // El equipo elegido puede no existir en otro periodo o planta.
        setSelectedEquipmentId((current) =>
          response.byEquipment.some((row) => row.equipmentId === current)
            ? current
            : null,
        );
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [manufacturingPlantId, startDate, endDate]);

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
