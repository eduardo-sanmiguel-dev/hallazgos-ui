"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";

import { useRouter } from "next/navigation";

import { Alert, Box, Grid, Paper, Skeleton, Tab, Tabs } from "@mui/material";

import { DashboardService } from "@services";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import { useHighchartsTheme } from "@hooks/useHighchartsTheme";
import PageHeader from "@shared/components/PageHeader";
import { ROLE_ADMINISTRADOR } from "@shared/constants";

import KpiTile from "./_components/KpiTile";
import OutOfRangePanel from "./_components/OutOfRangePanel";
import PeriodFilter from "./_components/PeriodFilter";
import { DEFAULT_PERIOD, type PeriodValue } from "./_lib/period";
import {
  BiData,
  computeKpis,
  formatMoney,
  formatNumber,
  formatPercent,
  periodNames,
} from "./_lib/biEpp";
import SpendByEquipmentChart from "./charts/SpendByEquipmentChart";
import MonthlySpendChart from "./charts/MonthlySpendChart";
import AverageSpendChart from "./charts/AverageSpendChart";
import SpendShareChart from "./charts/SpendShareChart";
import UnitsByEquipmentChart from "./charts/UnitsByEquipmentChart";
import DeliveriesRangeChart from "./charts/DeliveriesRangeChart";
import EmployeesWithDeliveryChart from "./charts/EmployeesWithDeliveryChart";

// Configuración de la planta que necesita un indicador para tener sentido:
// - prices: algún equipo con precio (si no, todo saldría en $0);
// - frequency: frecuencia de entrega en sus equipos (si no, no hay "fuera de
//   rango"). Sin ella, se oculta (ver tracksDeliveryFrequency en la API).
type Requirement = "prices" | "frequency";

type ChartItem = {
  Component: ComponentType<{ data: BiData }>;
  fullWidth?: boolean;
  requires?: Requirement;
};

// `panel`: la pestaña tiene su propio contenido y datos (no gráficas sueltas).
const chartGroups: {
  title: string;
  charts: ChartItem[];
  requires?: Requirement;
  panel?: "outOfRange";
}[] = [
  {
    title: "Gasto",
    requires: "prices",
    charts: [
      { Component: MonthlySpendChart },
      { Component: AverageSpendChart },
      { Component: SpendByEquipmentChart, fullWidth: true },
      { Component: SpendShareChart, fullWidth: true },
    ],
  },
  {
    title: "Entregas",
    charts: [
      { Component: DeliveriesRangeChart, requires: "frequency" },
      { Component: EmployeesWithDeliveryChart },
      { Component: UnitsByEquipmentChart, fullWidth: true },
    ],
  },
  // Qué equipos se entregan antes de tiempo y a quién.
  {
    title: "Fuera de rango",
    charts: [],
    requires: "frequency",
    panel: "outOfRange",
  },
];

const EPPCharts = () => {
  // Al cambiar de tema se vuelven a crear las gráficas con sus colores.
  const chartsMode = useHighchartsTheme();
  // Por nombre: al cambiar de planta pueden ocultarse pestañas de gasto.
  const [activeTitle, setActiveTitle] = useState(chartGroups[0].title);
  const [data, setData] = useState<BiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manufacturingPlantId, setManufacturingPlantId] = useState("");
  // Por omisión el mes en curso a la fecha; la API calcula la comparación.
  const [period, setPeriod] = useState<PeriodValue>(() => DEFAULT_PERIOD());
  const { startDate, endDate } = period;

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );
  // Solo administradores (la API también lo exige). El rol llega vacío
  // mientras carga la sesión: no se redirige ni se piden datos hasta tenerlo.
  const router = useRouter();
  const role = useUserSessionStore((state) => state.role);
  const isAdmin = role === ROLE_ADMINISTRADOR;

  useEffect(() => {
    if (role && !isAdmin) router.replace("/dashboard");
  }, [role, isAdmin, router]);

  // La planta es obligatoria: los indicadores se calculan por planta.
  useEffect(() => {
    if (manufacturingPlants.length && !manufacturingPlantId) {
      setManufacturingPlantId(manufacturingPlants[0].id.toString());
    }
  }, [manufacturingPlants, manufacturingPlantId]);

  useEffect(() => {
    if (!manufacturingPlantId || !isAdmin) return;

    let ignore = false;
    setIsLoading(true);

    DashboardService.findBusinessIntelligenceEpp({
      manufacturingPlantId,
      startDate,
      endDate,
    })
      .then((response) => {
        if (!ignore) setData(response);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [manufacturingPlantId, startDate, endDate, isAdmin]);

  const kpis = useMemo(() => (data ? computeKpis(data) : null), [data]);
  const isFirstLoad = !data;
  // Mientras carga se asume que la planta lo tiene todo (no se oculta nada
  // de antemano).
  const showPrices = data ? data.hasPrices : true;
  const showFrequency = data ? data.tracksDeliveryFrequency : true;
  const isAvailable = (requires?: Requirement) =>
    requires === "prices"
      ? showPrices
      : requires === "frequency"
        ? showFrequency
        : true;
  // Periodo elegido y su comparación, como los calculó la API.
  const { currentName, previousName } = data
    ? periodNames(data)
    : { currentName: "", previousName: "" };
  const groups = chartGroups.filter((group) => isAvailable(group.requires));
  const activeGroup =
    groups.find((group) => group.title === activeTitle) ?? groups[0];
  const activeTab = groups.indexOf(activeGroup);
  const charts = activeGroup.charts.filter((chart) =>
    isAvailable(chart.requires),
  );
  // Una gráfica de media anchura que se queda sin pareja ocupa la fila.
  const halfCharts = charts.filter((chart) => !chart.fullWidth);
  const loneHalf = halfCharts.length % 2 ? halfCharts.at(-1) : undefined;
  // Qué se ocultó y por qué (un solo aviso).
  const hiddenNotice =
    !showPrices && !showFrequency
      ? "Los equipos de esta planta no tienen precio ni frecuencia de entrega registrados, por eso no se muestran los indicadores de gasto ni de entregas fuera de rango."
      : !showPrices
        ? "Los equipos de esta planta no tienen precio registrado, por eso no se muestran los indicadores de gasto."
        : !showFrequency
          ? "La mayoría de los equipos de esta planta no tiene frecuencia de entrega, por eso no se muestran los indicadores de entregas fuera de rango."
          : null;

  // No administrador: se está redirigiendo, no se muestra nada.
  if (role && !isAdmin) return null;

  return (
    <>
      <PageHeader
        title="Análisis de datos EPP"
        description={
          data ? `${currentName} comparado con ${previousName}` : undefined
        }
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <PeriodFilter value={period} onChange={setPeriod} />
          <Box sx={{ minWidth: 220, flex: { xs: "1 1 100%", sm: "0 0 auto" } }}>
            <SelectDefault
              data={manufacturingPlants}
              label="Planta"
              value={manufacturingPlantId}
              onChange={(e) => setManufacturingPlantId(e.target.value)}
            />
          </Box>
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
        {hiddenNotice && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {hiddenNotice} Puedes capturarlos en Equipos.
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: "Gasto",
              requires: "prices" as Requirement,
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
              label: "Entregas fuera de rango",
              requires: "frequency" as Requirement,
              value: kpis ? formatPercent(kpis.outOfRange.current) : "",
              caption: kpis
                ? `${formatNumber(kpis.outOfRange.deliveries)} ${kpis.outOfRange.deliveries === 1 ? "entrega" : "entregas"} en el periodo`
                : undefined,
              delta: kpis && {
                ...kpis.outOfRange,
                mode: "points" as const,
                polarity: "bad" as const,
              },
            },
            {
              label: "Gasto promedio por colaborador",
              requires: "prices" as Requirement,
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
          ]
            .filter(({ requires }) => isAvailable(requires))
            .map(({ label, value, caption, delta }, _, tiles) => (
              <Grid
                key={label}
                // 3 por fila (4 indicadores: 2 por fila); en pantallas
                // grandes, todos en una fila.
                size={{
                  xs: 12,
                  sm: 6,
                  md: tiles.length === 4 ? 6 : 4,
                  xl: 12 / tiles.length,
                }}
              >
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
            onChange={(_, newValue: number) =>
              setActiveTitle(groups[newValue].title)
            }
            aria-label="Grupos de indicadores EPP"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {groups.map((group, index) => (
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
          {activeGroup.panel === "outOfRange" && (
            <Grid size={{ xs: 12 }}>
              <OutOfRangePanel
                manufacturingPlantId={manufacturingPlantId}
                startDate={startDate}
                endDate={endDate}
              />
            </Grid>
          )}
          {charts.map((chart, index) => {
            const { Component } = chart;
            return (
              <Grid
                key={`${activeGroup.title}-${index}`}
                size={{
                  xs: 12,
                  lg: chart.fullWidth || chart === loneHalf ? 12 : 6,
                }}
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
            );
          })}
        </Grid>
      </Box>
    </>
  );
};

export default EPPCharts;
