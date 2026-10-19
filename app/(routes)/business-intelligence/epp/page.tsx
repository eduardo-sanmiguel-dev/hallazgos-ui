"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";

import { Box, Grid, Paper, Skeleton, Tab, Tabs } from "@mui/material";

import { DashboardService } from "@services";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import { useHighchartsTheme } from "@hooks/useHighchartsTheme";
import PageHeader from "@shared/components/PageHeader";

import KpiTile from "./_components/KpiTile";
import {
  BiData,
  computeKpis,
  currentAndPreviousMonth,
  formatMoney,
  formatNumber,
  formatPercent,
} from "./_lib/biEpp";
import SpendByEquipmentChart from "./charts/SpendByEquipmentChart";
import MonthlySpendChart from "./charts/MonthlySpendChart";
import AverageSpendChart from "./charts/AverageSpendChart";
import SpendShareChart from "./charts/SpendShareChart";
import CurrentPriceChart from "./charts/CurrentPriceChart";
import UnitsByEquipmentChart from "./charts/UnitsByEquipmentChart";
import DeliveriesRangeChart from "./charts/DeliveriesRangeChart";
import EmployeesWithDeliveryChart from "./charts/EmployeesWithDeliveryChart";
import CoverageChart from "./charts/CoverageChart";
import NewEmployeesEquipmentChart from "./charts/NewEmployeesEquipmentChart";

type ChartItem = {
  Component: ComponentType<{ data: BiData }>;
  fullWidth?: boolean;
};

const chartGroups: { title: string; charts: ChartItem[] }[] = [
  {
    title: "Gasto",
    charts: [
      { Component: MonthlySpendChart },
      { Component: AverageSpendChart },
      { Component: SpendByEquipmentChart, fullWidth: true },
    ],
  },
  {
    title: "Costos por equipo",
    charts: [{ Component: SpendShareChart }, { Component: CurrentPriceChart }],
  },
  {
    title: "Entregas",
    charts: [
      { Component: DeliveriesRangeChart },
      { Component: EmployeesWithDeliveryChart },
      { Component: UnitsByEquipmentChart, fullWidth: true },
    ],
  },
  {
    title: "Cobertura",
    charts: [
      { Component: CoverageChart },
      { Component: NewEmployeesEquipmentChart },
    ],
  },
];

const EPPCharts = () => {
  // Al cambiar de tema se vuelven a crear las gráficas con sus colores.
  const chartsMode = useHighchartsTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<BiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState("");

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const { currentName, previousName } = currentAndPreviousMonth();

  // La planta es obligatoria: los indicadores se calculan por planta.
  useEffect(() => {
    if (manufacturingPlants.length && !manufacturingPlantId) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
    }
  }, [manufacturingPlants, manufacturingPlantId]);

  useEffect(() => {
    if (!manufacturingPlantId) return;

    let ignore = false;
    setIsLoading(true);

    DashboardService.findBusinessIntelligenceEpp({ manufacturingPlantId })
      .then((response) => {
        if (!ignore) setData(response);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [manufacturingPlantId]);

  const kpis = useMemo(() => (data ? computeKpis(data) : null), [data]);
  const isFirstLoad = !data;
  const activeGroup = chartGroups[activeTab];

  return (
    <>
      <PageHeader
        title="Análisis de datos EPP"
        description={`${currentName} comparado con ${previousName}`}
      >
        <Box sx={{ minWidth: 220 }}>
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            value={manufacturingPlantId}
            onChange={(e) => setManufacturingPlantId(e.target.value)}
          />
        </Box>
      </PageHeader>

      {/* En recargas se conserva lo anterior atenuado, sin saltos de layout. */}
      <Box
        sx={{
          opacity: isLoading && !isFirstLoad ? 0.55 : 1,
          transition: "opacity 0.2s ease",
        }}
        aria-busy={isLoading}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: "Gasto del mes",
              value: kpis ? formatMoney(kpis.spend.current) : "",
              delta: kpis && {
                ...kpis.spend,
                mode: "relative" as const,
                polarity: "neutral" as const,
              },
            },
            {
              label: "Unidades entregadas",
              value: kpis ? formatNumber(kpis.units.current) : "",
              delta: kpis && {
                ...kpis.units,
                mode: "relative" as const,
                polarity: "neutral" as const,
              },
            },
            {
              label: "Cobertura de colaboradores",
              value: kpis ? formatPercent(kpis.coverage.current) : "",
              caption: kpis
                ? `${formatNumber(kpis.coverage.withDelivery)} de ${formatNumber(kpis.coverage.activeEmployees)} activos con entrega`
                : undefined,
              delta: kpis && {
                ...kpis.coverage,
                mode: "points" as const,
                polarity: "good" as const,
              },
            },
            {
              label: "Entregas fuera de rango",
              value: kpis ? formatPercent(kpis.outOfRange.current) : "",
              caption: kpis
                ? `${formatNumber(kpis.outOfRange.deliveries)} entregas en el mes`
                : undefined,
              delta: kpis && {
                ...kpis.outOfRange,
                mode: "points" as const,
                polarity: "bad" as const,
              },
            },
            {
              label: "Gasto promedio por colaborador",
              value: kpis ? formatMoney(kpis.averagePerEmployee.current) : "",
              caption: kpis
                ? `Promedio global ${formatMoney(kpis.averagePerEmployee.globalAverage)}`
                : undefined,
              delta: kpis && {
                ...kpis.averagePerEmployee,
                mode: "relative" as const,
                polarity: "neutral" as const,
              },
            },
            {
              label: "Primera entrega de EPP",
              value: kpis ? formatNumber(kpis.newEmployees.current) : "",
              caption: "Colaboradores nuevos en EPP",
              delta: kpis && {
                ...kpis.newEmployees,
                mode: "relative" as const,
                polarity: "neutral" as const,
              },
            },
          ].map(({ label, value, caption, delta }) => (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4, xl: 2 }}>
              <KpiTile
                label={label}
                value={value}
                caption={caption}
                isLoading={isFirstLoad}
                delta={
                  delta
                    ? {
                        current: delta.current,
                        previous: delta.previous,
                        mode: delta.mode,
                        polarity: delta.polarity,
                        comparedTo: previousName,
                      }
                    : undefined
                }
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue: number) => setActiveTab(newValue)}
            aria-label="Grupos de indicadores EPP"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {chartGroups.map((group, index) => (
              <Tab
                key={group.title}
                label={group.title}
                id={`epp-group-tab-${index}`}
                aria-controls={`epp-group-panel-${index}`}
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Tabs>
        </Box>

        <Grid
          key={`${chartsMode}-${activeTab}`}
          container
          spacing={2}
          role="tabpanel"
          id={`epp-group-panel-${activeTab}`}
          aria-labelledby={`epp-group-tab-${activeTab}`}
        >
          {activeGroup.charts.map(({ Component, fullWidth }, index) => (
            <Grid
              key={`${activeGroup.title}-${index}`}
              size={{ xs: 12, lg: fullWidth ? 12 : 6 }}
            >
              {data ? (
                <Component data={data} />
              ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Skeleton variant="text" width="45%" />
                  <Skeleton variant="rounded" height={300} sx={{ mt: 1 }} />
                </Paper>
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default EPPCharts;
