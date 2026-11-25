import { useMemo, useState } from "react";

import {
  keepPreviousData,
  useIsFetching,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Paper,
  SelectChangeEvent,
  Skeleton,
} from "@mui/material";
import "dayjs/locale/es";
import { useRouter } from "@shared/navigation";
import { toast } from "sonner";

import { UserOption } from "@interfaces";
import { DashboardService, UsersService } from "@services";
import { useUserSessionStore } from "@store";
import { EMPTY_CATALOG, useAreas, useDebouncedFilters, useMainTypes } from "@hooks";
import { catalogKeys } from "@shared/libs/catalogKeys";
import { useHighchartsTheme } from "@hooks/useHighchartsTheme";
import EmptyState from "@shared/components/EmptyState";
import ErrorState from "@shared/components/ErrorState";
import KpiTile from "@shared/components/KpiTile";
import PageHeader from "@shared/components/PageHeader";
import { accentCard } from "@shared/utils/accentCard";
import { DEFAULT_PERIOD, PERIOD_PRESETS, periodLabel, presetRange } from "@shared/utils/period";
import { proposedPlantId } from "@shared/utils/lastPlant";
import AreaImageCoordinateSelector from "../areas/_components/AreaImageCoordinateSelector";
import { PLANT_PLAN } from "../areas/_lib/plantPlan";
import AreasChart from "./charts/AreasChart";
import MainTypesChart from "./charts/MainTypesChart";
import StatusChart from "./charts/StatusChart";
import AssignedResponsibleChart from "./charts/AssignedResponsibleChart";
import HistoricalChart from "./charts/HistoricalChart";
import SankeyDiagramChart from "./charts/SankeyDiagramChart";
import PackedBubbleChart from "./charts/PackedBubbleChart";
import SolidGaugeMultiKpiChart from "./charts/SolidGaugeMultiKpiChart";
import AreaRangeLineChart from "./charts/AreaRangeLineChart";
import PriorityInterventionChart from "./charts/PriorityInterventionChart";
import RiskLevelChart from "./charts/RiskLevelChart";
import { DashboardFiltersBar, type DashboardFilters } from "./_components/DashboardFiltersBar";
import LazyChart, { LAZY_CHART_PENDING } from "./_components/LazyChart";
import type { DashboardPdfHeader } from "./_lib/dashboardPdf";
import {
  hasCompleteFilters,
  useDashboardSummary,
  usePrefetchDashboardCharts,
} from "./_components/useDashboardSummary";

const restrictedDashboardEmail = "glora@hadainternational.com";

// "Ampliar el periodo" del aviso sin hallazgos: un atajo del control de
// periodo (antes, 90 días sueltos).
const WIDER_PRESET = "last3";
const WIDER_LABEL = PERIOD_PRESETS.find(({ value }) => value === WIDER_PRESET)!.label.toLowerCase();

/** 'DD/MM/YYYY' (filtros) → 'YYYY-MM-DD' (como los rangos de la API). */
const toIso = (value: string) => value.split("/").reverse().join("-");

const formatCount = (value: number, decimals = 0) =>
  value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Gráficas visibles en pantalla (las ocultas por filtros no se exportan). */
const visibleDashboardCharts = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-dashboard-export='chart']")).filter(
    (element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && element.offsetParent !== null;
    },
  );

// Fuera del componente: React Compiler no soporta import() ni try/finally y
// dejaba sin optimizar toda la página (y con ella cada gráfica). Gráficas como
// vector (ver _lib/dashboardPdf); jsPDF se carga solo al exportar.
const exportDashboardPdf = async (charts: HTMLElement[], header: DashboardPdfHeader) => {
  try {
    const { downloadDashboardPdf } = await import("./_lib/dashboardPdf");
    await downloadDashboardPdf(charts, header);
  } catch {
    toast.error("No se pudo generar el informe PDF");
  }
};

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Antes de exportar: espera a que las gráficas forzadas (LazyChart) se
 * monten, a que lleguen sus datos y, si alguna recién se montó, a que
 * termine su animación de entrada (Highcharts: 1 s), para no capturarla a
 * medias. Con tope de tiempo: un dato que no llega no bloquea el PDF.
 */
const waitForLazyCharts = async (queryClient: QueryClient, newlyMounted: boolean) => {
  const deadline = Date.now() + 10_000;
  do await nextFrame();
  while (
    (document.querySelector(LAZY_CHART_PENDING) ||
      queryClient.isFetching({ queryKey: ["dashboard"] }) > 0) &&
    Date.now() < deadline
  );
  if (newlyMounted) await new Promise((resolve) => setTimeout(resolve, 1_100));
};

const DashboardPage = () => {
  const router = useRouter();
  // Al cambiar de tema se vuelven a crear las gráficas con sus colores.
  const chartsMode = useHighchartsTheme();

  const manufacturingPlants = useUserSessionStore((state) => state.manufacturingPlants || []);

  const email = useUserSessionStore((state) => state.email);
  const userId = useUserSessionStore((state) => state.id);

  // La sesión ya está restaurada: proponer planta y periodo una vez, sin pisar
  // lo que el usuario elija o borre después. Los últimos 30 días incluyen hoy.
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const { preset, startDate, endDate } = DEFAULT_PERIOD();
    const plantId = proposedPlantId(manufacturingPlants, userId);
    const plant = manufacturingPlants.find((item) => String(item.id) === plantId);
    return {
      manufacturingPlantId: plantId,
      manufacturingPlantName: plant?.name ?? "",
      periodPreset: preset,
      startDate,
      endDate,
      areaIds: [],
      areaNames: [],
      responsibleIds: [],
      responsibleNames: [],
      mainTypeIds: [],
      mainTypeNames: [],
      states: [],
    };
  });
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const [isHeatmapView, setIsHeatmapView] = useState(false);
  const [isDownloadingPdfReport, setIsDownloadingPdfReport] = useState(false);
  // Las gráficas de abajo se montan al acercarse (LazyChart); el PDF las
  // necesita todas.
  const [renderAllCharts, setRenderAllCharts] = useState(false);
  const queryClient = useQueryClient();
  const shouldHideProjectionCharts =
    filters.areaIds.length > 1 || filters.responsibleIds.length > 1;

  const mainTypes = useMainTypes().data ?? EMPTY_CATALOG;
  const excludedMainTypeNames = ["Comportamiento inseguro", "Condición insegura"];
  const availableMainTypes = mainTypes.filter((item) =>
    restrictedDashboardEmail === email ? !excludedMainTypeNames.includes(item.name) : true,
  );

  const handlePlantChange = (event: SelectChangeEvent<string>) => {
    const selectedPlant = manufacturingPlants.find(
      (item) => String(item.id) === event.target.value,
    );

    setFilters((prev) => ({
      ...prev,
      manufacturingPlantId: event.target.value,
      manufacturingPlantName: selectedPlant?.name || "",
      areaIds: [],
      areaNames: [],
      responsibleIds: [],
      responsibleNames: [],
    }));
  };

  // Las consultas (resumen, gráficas, mapa de calor, responsables) usan los
  // filtros tras una pausa: elegir varias zonas o clasificaciones seguidas
  // pedía las ~12 consultas de la pantalla una vez por cada opción.
  const { debounced: queryFilters } = useDebouncedFilters(filters);

  // Estado de la pantalla: un solo aviso (sin planta, sin periodo, sin
  // hallazgos o error) en lugar de uno por gráfica. Las gráficas se montan
  // solo con datos que mostrar.
  const summary = useDashboardSummary(queryFilters);
  // Los datos de las gráficas salen junto con el resumen, sin esperarlo.
  usePrefetchDashboardCharts(queryFilters, !isHeatmapView && !isHistoricalView);
  const hasExtraFilters =
    filters.areaIds.length > 0 ||
    filters.responsibleIds.length > 0 ||
    filters.mainTypeIds.length > 0 ||
    filters.states.length > 0;
  const screenState = !filters.manufacturingPlantId
    ? "noPlant"
    : !hasCompleteFilters(filters)
      ? "noPeriod"
      : summary.isError
        ? "error"
        : !summary.data
          ? "loading"
          : summary.data.total === 0
            ? "empty"
            : "ready";
  const showCharts = screenState === "ready";
  // Al cambiar un filtro las gráficas conservan los datos anteriores hasta
  // tener los nuevos: sin aviso parecía que no pasaba nada y RUM registraba
  // clics repetidos (p. ej. en "Mes anterior").
  const isRefreshingCharts = useIsFetching({ queryKey: ["dashboard"] }) > 0 && showCharts;

  const clearExtraFilters = () =>
    setFilters((prev) => ({
      ...prev,
      areaIds: [],
      areaNames: [],
      responsibleIds: [],
      responsibleNames: [],
      mainTypeIds: [],
      mainTypeNames: [],
      states: [],
    }));

  const widenPeriod = () => {
    const { preset, startDate, endDate } = presetRange(WIDER_PRESET);
    setFilters((prev) => ({
      ...prev,
      periodPreset: preset,
      startDate,
      endDate,
    }));
  };

  // Leyenda del periodo, como el análisis EPP: "30 sep – 29 oct 2026
  // comparado con 31 ago – 29 sep 2026". La comparación la calcula la API;
  // solo se usa si corresponde al periodo en pantalla (al cambiarlo se ve la
  // respuesta anterior mientras llega la nueva).
  const currentRange =
    queryFilters.startDate && queryFilters.endDate
      ? { desde: toIso(queryFilters.startDate), hasta: toIso(queryFilters.endDate) }
      : null;
  const comparison =
    summary.data?.periodo &&
    currentRange &&
    summary.data.periodo.actual.desde === currentRange.desde &&
    summary.data.periodo.actual.hasta === currentRange.hasta
      ? summary.data.periodo
      : null;
  const previousName = comparison ? periodLabel(comparison.anterior) : "";
  const periodDescription = currentRange
    ? `${periodLabel(currentRange)}${previousName ? ` comparado con ${previousName}` : ""}`
    : undefined;

  // Indicadores del periodo con su variación (antes solo había gráficas).
  const countOf = (
    data: { seriesData: { name: string; y: number }[] } | null | undefined,
    status: string,
  ) => data?.seriesData.find(({ name }) => name === status)?.y ?? 0;
  const closedRate = (data: { total: number; seriesData: { name: string; y: number }[] } | null) =>
    data?.total ? (countOf(data, "Cerrado") / data.total) * 100 : 0;
  const current = summary.data ?? null;
  const previous = comparison ? (summary.data?.anterior ?? null) : null;
  const kpiTiles = current
    ? [
        {
          label: "Hallazgos",
          icon: <AssignmentOutlinedIcon />,
          current: current.total,
          previous: previous?.total,
          polarity: "neutral" as const,
          caption: "Reportados en el periodo",
        },
        {
          label: "Abiertos",
          status: "Abierto",
          icon: <ErrorOutlineIcon />,
          current: countOf(current, "Abierto"),
          previous: previous && countOf(previous, "Abierto"),
          polarity: "bad" as const,
        },
        {
          label: "En progreso",
          status: "En progreso",
          icon: <AutorenewIcon />,
          current: countOf(current, "En progreso"),
          previous: previous && countOf(previous, "En progreso"),
          polarity: "neutral" as const,
        },
        {
          label: "Cerrados",
          status: "Cerrado",
          icon: <TaskAltIcon />,
          current: countOf(current, "Cerrado"),
          previous: previous && countOf(previous, "Cerrado"),
          polarity: "good" as const,
        },
        {
          label: "% de cierre",
          status: "Cerrado",
          icon: <DonutLargeIcon />,
          current: closedRate(current),
          previous: previous ? closedRate(previous) : undefined,
          polarity: "good" as const,
          points: true,
          caption: `${formatCount(countOf(current, "Cerrado"))} de ${formatCount(current.total)} cerrados`,
        },
      ].filter(
        (tile) =>
          !tile.status || filters.states.length === 0 || filters.states.includes(tile.status),
      )
    : [];

  // Zonas de la planta elegida (caché compartida).
  const areas =
    useAreas(
      { manufacturingPlantId: filters.manufacturingPlantId },
      { enabled: !!filters.manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;

  // Responsables del filtro: con zonas y periodo, los que tienen hallazgos
  // ahí; si no, todos los usuarios de la planta.
  const shouldLoadResponsiblesByArea =
    queryFilters.areaIds.length > 0 && !!queryFilters.startDate && !!queryFilters.endDate;
  const responsiblesParams = shouldLoadResponsiblesByArea
    ? {
        manufacturingPlantId: queryFilters.manufacturingPlantId,
        startDate: queryFilters.startDate,
        endDate: queryFilters.endDate,
        areaIds: queryFilters.areaIds,
        states: queryFilters.states,
        ...(queryFilters.mainTypeIds.length > 0 && {
          mainTypeIds: queryFilters.mainTypeIds,
        }),
      }
    : { manufacturingPlantId: queryFilters.manufacturingPlantId };
  const { data: responsibles = EMPTY_CATALOG } = useQuery<UserOption[]>({
    // Sin zonas: la misma lista (y llave) que los filtros de hallazgos, para
    // no pedirla otra vez al pasar del dashboard a la lista.
    queryKey: shouldLoadResponsiblesByArea
      ? ["dashboard", "responsibles", responsiblesParams]
      : catalogKeys.users(responsiblesParams),
    queryFn: () =>
      shouldLoadResponsiblesByArea
        ? DashboardService.findResponsiblesByFilters({
            manufacturingPlantId: queryFilters.manufacturingPlantId,
            startDate: queryFilters.startDate,
            endDate: queryFilters.endDate,
            areaIds: queryFilters.areaIds,
            states: queryFilters.states,
            ...(queryFilters.mainTypeIds.length > 0 && {
              mainTypeIds: queryFilters.mainTypeIds,
            }),
          })
        : UsersService.findAll({
            manufacturingPlantId: queryFilters.manufacturingPlantId,
          }),
    enabled: !!queryFilters.manufacturingPlantId,
    placeholderData: keepPreviousData,
  });

  const sortedResponsibles = useMemo(
    () =>
      [...responsibles].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [responsibles],
  );

  // Mapa de calor: solo mientras se ve esa vista y con planta y periodo.
  const isHeatmapEnabled =
    isHeatmapView &&
    !!queryFilters.manufacturingPlantId &&
    !!queryFilters.startDate &&
    !!queryFilters.endDate;
  const heatmapQuery = useQuery({
    queryKey: [
      "dashboard",
      "heatmap",
      {
        manufacturingPlantId: queryFilters.manufacturingPlantId,
        startDate: queryFilters.startDate,
        endDate: queryFilters.endDate,
        areaIds: queryFilters.areaIds,
        responsibleIds: queryFilters.responsibleIds,
        mainTypeIds: queryFilters.mainTypeIds,
        states: queryFilters.states,
      },
    ],
    queryFn: () =>
      DashboardService.findHeatmapByFilters({
        manufacturingPlantId: queryFilters.manufacturingPlantId,
        startDate: queryFilters.startDate,
        endDate: queryFilters.endDate,
        areaIds: queryFilters.areaIds,
        responsibleIds: queryFilters.responsibleIds,
        states: queryFilters.states,
        ...(queryFilters.mainTypeIds.length > 0 && {
          mainTypeIds: queryFilters.mainTypeIds,
        }),
      }),
    enabled: isHeatmapEnabled,
  });
  const heatmapData = isHeatmapEnabled ? (heatmapQuery.data ?? null) : null;
  const isHeatmapLoading = isHeatmapEnabled && heatmapQuery.isFetching;

  const areAllAreasSelected =
    filters.areaIds.length === 0 || (areas.length > 0 && filters.areaIds.length === areas.length);
  const areAllResponsiblesSelected =
    filters.responsibleIds.length === 0 ||
    (sortedResponsibles.length > 0 && filters.responsibleIds.length === sortedResponsibles.length);

  const heatmapFiltersTitle = [
    filters.manufacturingPlantName ? `Planta: ${filters.manufacturingPlantName}` : "Planta: todas",
    filters.startDate && filters.endDate
      ? `Periodo: ${filters.startDate} - ${filters.endDate}`
      : "Periodo: sin rango",
    filters.states.length > 0 ? `Estatus: ${filters.states.join(", ")}` : "",
    filters.mainTypeNames.length > 0 ? `Clasificación: ${filters.mainTypeNames.join(", ")}` : "",
    !areAllAreasSelected && filters.areaNames.length
      ? `Zonas: ${filters.areaNames.join(", ")}`
      : "",
    !areAllResponsiblesSelected && filters.responsibleNames.length
      ? `Responsables: ${filters.responsibleNames.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const handleToggleHeatmapView = () => {
    setIsHistoricalView(false);
    setIsHeatmapView((prev) => {
      const next = !prev;
      return next;
    });
  };

  const handleBackToInitialCharts = () => {
    setIsHeatmapView(false);
  };

  const handleGoToHallazgos = () => {
    const params = new URLSearchParams();

    if (filters.manufacturingPlantId) {
      params.set("manufacturingPlantId", filters.manufacturingPlantId);
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    if (filters.mainTypeIds.length > 0) {
      params.set("mainTypeIds", filters.mainTypeIds.join(","));
    }

    if (filters.areaIds.length > 0) {
      params.set("areaIds", filters.areaIds.join(","));
    }

    if (filters.responsibleIds.length > 0) {
      params.set("responsibleIds", filters.responsibleIds.join(","));
    }

    if (filters.states.length > 0) {
      params.set("states", filters.states.join(","));
    }

    const queryString = params.toString();
    router.push(queryString ? `/hallazgos?${queryString}` : "/hallazgos");
  };

  const handleDownloadDashboardPdf = async () => {
    if (!filters.manufacturingPlantId || isDownloadingPdfReport) {
      return;
    }

    setIsDownloadingPdfReport(true);
    const newlyMounted = !!document.querySelector(LAZY_CHART_PENDING);
    setRenderAllCharts(true);
    await waitForLazyCharts(queryClient, newlyMounted);

    const visibleCharts = visibleDashboardCharts();
    if (!visibleCharts.length) {
      toast.error("No hay gráficas visibles para exportar");
      setIsDownloadingPdfReport(false);
      return;
    }

    await exportDashboardPdf(visibleCharts, {
      title: "Informe de Dashboard de Hallazgos",
      lines: [
        `Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`,
        filters.manufacturingPlantName
          ? `Planta: ${filters.manufacturingPlantName}`
          : "Planta: Sin especificar",
        `Filtros: ${heatmapFiltersTitle || "Sin filtros adicionales"}`,
      ],
      fileName: `Informe_Dashboard_${dayjs().format("YYYYMMDD_HHmm")}.pdf`,
    });
    setIsDownloadingPdfReport(false);
  };

  if (email === "cosmeticostrujillo0023@gmail.com") {
    return window.location.replace("/hds");
  }

  return (
    <Grid
      key={chartsMode}
      container
      spacing={2}
      // Tarjetas de las gráficas con el acento de las demás pantallas.
      sx={(theme) => ({
        '& [data-dashboard-export="chart"] > .MuiPaper-root': accentCard(theme),
      })}
    >
      {isHistoricalView ? (
        <>
          <Grid size={{ xs: 12 }}>
            <PageHeader title="Histórico de hallazgos">
              <Button
                variant="outlined"
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={() => setIsHistoricalView(false)}
              >
                Regresar
              </Button>
            </PageHeader>
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper sx={{ minHeight: 500, p: 2 }}>
              <HistoricalChart />
            </Paper>
          </Grid>
        </>
      ) : (
        <>
          {/* El encabezado ya deja su margen: sin sumar el de la rejilla. */}
          <Grid size={{ xs: 12 }} sx={{ mb: -1.5 }}>
            {/* Visible, con la leyenda del periodo (antes, el título solo
                para lectores de pantalla). */}
            <PageHeader title="Dashboard de hallazgos" description={periodDescription} />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
            // Fija solo en escritorio: en celular y tablet, abierta ocupaba
            // toda la pantalla y cerrada tapaba las gráficas al bajar.
            sx={{
              position: { md: "sticky" },
              top: { md: 80 },
              zIndex: (theme) => theme.zIndex.appBar - 1,
            }}
          >
            <DashboardFiltersBar
              filters={filters}
              setFilters={setFilters}
              areas={areas}
              availableMainTypes={availableMainTypes}
              sortedResponsibles={sortedResponsibles}
              isHeatmapView={isHeatmapView}
              setIsHeatmapView={setIsHeatmapView}
              setIsHistoricalView={setIsHistoricalView}
              isDownloadingPdfReport={isDownloadingPdfReport}
              canDownloadPdf={showCharts}
              handlePlantChange={handlePlantChange}
              handleToggleHeatmapView={handleToggleHeatmapView}
              handleBackToInitialCharts={handleBackToInitialCharts}
              handleGoToHallazgos={handleGoToHallazgos}
              handleDownloadDashboardPdf={handleDownloadDashboardPdf}
            />
            {/* Alto fijo: la barra aparece y desaparece sin mover la página. */}
            <Box sx={{ height: 4, mt: 1 }} aria-busy={isRefreshingCharts}>
              {isRefreshingCharts && <LinearProgress aria-label="Actualizando gráficas" />}
            </Box>
          </Grid>

          {!showCharts && (
            <Grid size={{ xs: 12 }}>
              {screenState === "loading" ? (
                <Box component="output" aria-label="Cargando gráficas">
                  <Grid container spacing={2}>
                    {[0, 1].map((index) => (
                      <Grid key={index} size={{ xs: 12, md: 6 }}>
                        <Skeleton variant="rounded" height={320} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : screenState === "error" ? (
                <Paper sx={{ p: 2 }}>
                  <ErrorState
                    offline={typeof navigator !== "undefined" && !navigator.onLine}
                    onRetry={() => summary.refetch()}
                    isRetrying={summary.isFetching}
                  />
                </Paper>
              ) : (
                <Paper sx={{ p: 2 }}>
                  {screenState === "noPlant" ? (
                    <EmptyState
                      title="Elige una planta"
                      description="En Filtros, elige la planta para ver sus gráficas."
                    />
                  ) : screenState === "noPeriod" ? (
                    <EmptyState
                      title="Elige el periodo"
                      description="En Filtros, elige la fecha de inicio y la de fin."
                    >
                      <Button variant="outlined" onClick={widenPeriod}>
                        Ver {WIDER_LABEL}
                      </Button>
                    </EmptyState>
                  ) : (
                    <EmptyState
                      title="Sin hallazgos en este periodo"
                      description={`No hay hallazgos de ${filters.manufacturingPlantName || "la planta"} del ${filters.startDate} al ${filters.endDate}${hasExtraFilters ? " con los filtros elegidos" : ""}.`}
                    >
                      {hasExtraFilters && (
                        <Button variant="outlined" onClick={clearExtraFilters}>
                          Quitar zonas, responsables, clasificación y estatus
                        </Button>
                      )}
                      {filters.periodPreset !== WIDER_PRESET && (
                        <Button variant="outlined" onClick={widenPeriod}>
                          Ver {WIDER_LABEL}
                        </Button>
                      )}
                    </EmptyState>
                  )}
                </Paper>
              )}
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid size={{ xs: 12 }}>
              <Box
                component="section"
                aria-label="Indicadores del periodo"
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    md: `repeat(${Math.min(3, kpiTiles.length)}, minmax(0, 1fr))`,
                    lg: `repeat(${kpiTiles.length}, minmax(0, 1fr))`,
                  },
                  // Dos por fila en celular: el último, solo, a lo ancho.
                  "& > :last-child:nth-of-type(odd)": {
                    gridColumn: { xs: "1 / -1", md: "auto" },
                  },
                }}
              >
                {kpiTiles.map((tile) => (
                  <KpiTile
                    key={tile.label}
                    label={tile.label}
                    icon={tile.icon}
                    value={
                      tile.points ? `${formatCount(tile.current, 1)}%` : formatCount(tile.current)
                    }
                    caption={tile.caption}
                    delta={
                      typeof tile.previous === "number"
                        ? {
                            current: tile.current,
                            previous: tile.previous,
                            mode: tile.points ? "points" : "relative",
                            polarity: tile.polarity,
                            comparedTo: previousName,
                          }
                        : undefined
                    }
                  />
                ))}
              </Box>
            </Grid>
          )}

          {showCharts && isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
              data-dashboard-export="chart"
            >
              <AreaImageCoordinateSelector
                plan={PLANT_PLAN}
                mode="heatmap"
                heatmapHeaderTitle={heatmapFiltersTitle}
                heatmapData={heatmapData}
                loading={isHeatmapLoading}
              />
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <Paper sx={{ p: 2 }}>
                <StatusChart filters={queryFilters} />
              </Paper>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <Paper sx={{ p: 2 }}>
                <AreasChart filters={queryFilters} />
              </Paper>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: shouldHideProjectionCharts ? 12 : 4,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={470} force={renderAllCharts}>
                <Paper sx={{ minHeight: 470, p: 2 }}>
                  <MainTypesChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && !shouldHideProjectionCharts && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 8,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={470} force={renderAllCharts}>
                <Paper sx={{ minHeight: 470, p: 2 }}>
                  <SolidGaugeMultiKpiChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={420} force={renderAllCharts}>
                <PriorityInterventionChart filters={queryFilters} />
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={420} force={renderAllCharts}>
                <RiskLevelChart filters={queryFilters} />
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && !shouldHideProjectionCharts && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={470} force={renderAllCharts}>
                <Paper sx={{ minHeight: 470, p: 2 }}>
                  <AreaRangeLineChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={560} force={renderAllCharts}>
                <Paper sx={{ minHeight: 560, p: 2 }}>
                  <PackedBubbleChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 6,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={560} force={renderAllCharts}>
                <Paper sx={{ minHeight: 560, p: 2 }}>
                  <SankeyDiagramChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}

          {showCharts && !isHeatmapView && (
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
              data-dashboard-export="chart"
            >
              <LazyChart height={400} force={renderAllCharts}>
                <Paper sx={{ minHeight: 400, p: 2 }}>
                  <AssignedResponsibleChart filters={queryFilters} />
                </Paper>
              </LazyChart>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
};

export default DashboardPage;
