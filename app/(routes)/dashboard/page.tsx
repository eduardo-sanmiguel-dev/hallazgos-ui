"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Box,
  Button,
  Fab,
  Grid,
  Paper,
  SelectChangeEvent,
  Skeleton,
  Typography,
  Zoom,
} from "@mui/material";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ResponseDashboardHeatmapByFilters, UserOption } from "@interfaces";
import { DashboardService, UsersService } from "@services";
import { useUserSessionStore } from "@store";
import { EMPTY_CATALOG, useAreas, useMainTypes } from "@hooks";
import { useHighchartsTheme } from "@hooks/useHighchartsTheme";
import EmptyState from "@shared/components/EmptyState";
import ErrorState from "@shared/components/ErrorState";
import { proposedPlantId, saveLastPlant } from "@shared/utils/lastPlant";
import AreaImageCoordinateSelector from "../areas/_components/AreaImageCoordinateSelector";
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
import {
  DashboardFiltersBar,
  type DashboardFilters,
} from "./_components/DashboardFiltersBar";
import {
  hasCompleteFilters,
  useDashboardSummary,
} from "./_components/useDashboardSummary";

// Título solo para lectores de pantalla: la barra de filtros es lo primero
// que se ve en la página.
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;

const restrictedDashboardEmail = "glora@hadainternational.com";

// Periodo por omisión (M5): los últimos 30 días, hoy incluido. Con "el mes en
// curso" (lo de antes), los primeros días del mes casi no había datos.
const DEFAULT_PERIOD_DAYS = 30;

// "Ampliar el periodo" del aviso sin hallazgos.
const WIDER_PERIOD_DAYS = 90;

const DATE_FORMAT = "DD/MM/YYYY";

const daysAgo = (days: number) =>
  dayjs()
    .subtract(days - 1, "day")
    .format(DATE_FORMAT);

const DashboardPage = () => {
  const router = useRouter();
  // Al cambiar de tema se vuelven a crear las gráficas con sus colores.
  const chartsMode = useHighchartsTheme();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants || [],
  );

  const email = useUserSessionStore((state) => state.email);
  const userId = useUserSessionStore((state) => state.id);

  const [filters, setFilters] = useState<DashboardFilters>({
    manufacturingPlantId: "",
    manufacturingPlantName: "",
    startDate: daysAgo(DEFAULT_PERIOD_DAYS),
    endDate: dayjs().format(DATE_FORMAT),
    areaIds: [],
    areaNames: [],
    responsibleIds: [],
    responsibleNames: [],
    mainTypeIds: [],
    mainTypeNames: [],
  });
  const [responsibles, setResponsibles] = useState<UserOption[]>([]);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const [isHeatmapView, setIsHeatmapView] = useState(false);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(false);
  const [isDownloadingPdfReport, setIsDownloadingPdfReport] = useState(false);
  const [heatmapData, setHeatmapData] =
    useState<ResponseDashboardHeatmapByFilters | null>(null);
  const sortedResponsibles = useMemo(
    () =>
      [...responsibles].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      ),
    [responsibles],
  );
  const shouldHideProjectionCharts =
    filters.areaIds.length > 1 || filters.responsibleIds.length > 1;

  const mainTypes = useMainTypes().data ?? EMPTY_CATALOG;
  const excludedMainTypeNames = [
    "Comportamiento inseguro",
    "Condición insegura",
  ];
  const availableMainTypes = mainTypes.filter((item) =>
    restrictedDashboardEmail === email
      ? !excludedMainTypeNames.includes(item.name)
      : true,
  );

  const parseDate = (value: string): Dayjs | null => {
    if (!value) return null;

    const [day, month, year] = value.split("/");

    if (!day || !month || !year) return null;

    const parsedDate = dayjs(`${year}-${month}-${day}`);
    return parsedDate.isValid() ? parsedDate : null;
  };

  const handlePlantChange = (event: SelectChangeEvent<string>) => {
    const selectedPlant = manufacturingPlants.find(
      (item) => String(item.id) === event.target.value,
    );

    if (selectedPlant && userId) {
      saveLastPlant(userId, "dashboard", event.target.value);
    }

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

  // Al entrar ya se ven datos (M5): la única planta del usuario o la última
  // que eligió aquí en este dispositivo. Una sola vez; si el usuario ya eligió
  // una (o la quitó), no se toca.
  const plantProposed = useRef(false);
  useEffect(() => {
    if (plantProposed.current || !userId || !manufacturingPlants.length) {
      return;
    }
    plantProposed.current = true;

    const plantId = proposedPlantId(manufacturingPlants, userId, "dashboard");
    const plant = manufacturingPlants.find(
      (item) => String(item.id) === plantId,
    );
    if (!plant) return;

    setFilters((prev) =>
      prev.manufacturingPlantId
        ? prev
        : {
            ...prev,
            manufacturingPlantId: plantId,
            manufacturingPlantName: plant.name,
          },
    );
  }, [userId, manufacturingPlants]);

  // Estado de la pantalla: un solo aviso (sin planta, sin periodo, sin
  // hallazgos o error) en lugar de uno por gráfica. Las gráficas se montan
  // solo con datos que mostrar.
  const summary = useDashboardSummary(filters);
  const hasExtraFilters =
    filters.areaIds.length > 0 ||
    filters.responsibleIds.length > 0 ||
    filters.mainTypeIds.length > 0;
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

  const clearExtraFilters = () =>
    setFilters((prev) => ({
      ...prev,
      areaIds: [],
      areaNames: [],
      responsibleIds: [],
      responsibleNames: [],
      mainTypeIds: [],
      mainTypeNames: [],
    }));

  const widenPeriod = () =>
    setFilters((prev) => ({
      ...prev,
      startDate: daysAgo(WIDER_PERIOD_DAYS),
      endDate: dayjs().format(DATE_FORMAT),
    }));

  // Zonas de la planta elegida (caché compartida).
  const areas =
    useAreas(
      { manufacturingPlantId: filters.manufacturingPlantId },
      { enabled: !!filters.manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;

  useEffect(() => {
    if (!filters.manufacturingPlantId) return;

    setFilters((prev) => ({
      ...prev,
      areaIds: [],
      areaNames: [],
      responsibleIds: [],
      responsibleNames: [],
    }));
  }, [filters.manufacturingPlantId]);

  useEffect(() => {
    if (!filters.manufacturingPlantId) {
      setResponsibles([]);
      return;
    }

    const shouldLoadByArea =
      filters.areaIds.length > 0 && !!filters.startDate && !!filters.endDate;

    if (shouldLoadByArea) {
      DashboardService.findResponsiblesByFilters({
        manufacturingPlantId: filters.manufacturingPlantId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        areaIds: filters.areaIds,
        ...(filters.mainTypeIds.length > 0 && {
          mainTypeIds: filters.mainTypeIds,
        }),
      }).then(setResponsibles);
      return;
    }

    UsersService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
    }).then(setResponsibles);
  }, [
    filters.manufacturingPlantId,
    filters.areaIds,
    filters.responsibleIds,
    filters.startDate,
    filters.endDate,
    filters.mainTypeIds,
  ]);

  useEffect(() => {
    if (!isHeatmapView) {
      return;
    }

    if (
      !filters.manufacturingPlantId ||
      !filters.startDate ||
      !filters.endDate
    ) {
      setHeatmapData(null);
      return;
    }

    setIsHeatmapLoading(true);
    DashboardService.findHeatmapByFilters({
      manufacturingPlantId: filters.manufacturingPlantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      areaIds: filters.areaIds,
      responsibleIds: filters.responsibleIds,
      ...(filters.mainTypeIds.length > 0 && {
        mainTypeIds: filters.mainTypeIds,
      }),
    })
      .then(setHeatmapData)
      .finally(() => setIsHeatmapLoading(false));
  }, [
    isHeatmapView,
    filters.manufacturingPlantId,
    filters.startDate,
    filters.endDate,
    filters.areaIds,
    filters.responsibleIds,
    filters.mainTypeIds,
  ]);

  const handleScrollTop = () => {
    const scrollableElements = Array.from(
      document.querySelectorAll<HTMLElement>("*"),
    ).filter((element) => {
      const styles = window.getComputedStyle(element);
      const overflowY = styles.overflowY;
      const isScrollable = overflowY === "auto" || overflowY === "scroll";

      return isScrollable && element.scrollHeight > element.clientHeight;
    });

    scrollableElements.forEach((element) => {
      if (element.scrollTop > 0) {
        element.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const areAllAreasSelected =
    filters.areaIds.length === 0 ||
    (areas.length > 0 && filters.areaIds.length === areas.length);
  const areAllResponsiblesSelected =
    filters.responsibleIds.length === 0 ||
    (sortedResponsibles.length > 0 &&
      filters.responsibleIds.length === sortedResponsibles.length);

  const heatmapFiltersTitle = [
    filters.manufacturingPlantName
      ? `Planta: ${filters.manufacturingPlantName}`
      : "Planta: todas",
    filters.startDate && filters.endDate
      ? `Periodo: ${filters.startDate} - ${filters.endDate}`
      : "Periodo: sin rango",
    filters.mainTypeNames.length > 0
      ? `Clasificación: ${filters.mainTypeNames.join(", ")}`
      : "",
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
      if (!next) {
        setHeatmapData(null);
        setIsHeatmapLoading(false);
      }
      return next;
    });
  };

  const handleBackToInitialCharts = () => {
    setIsHeatmapView(false);
    setHeatmapData(null);
    setIsHeatmapLoading(false);
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

    const queryString = params.toString();
    router.push(queryString ? `/hallazgos?${queryString}` : "/hallazgos");
  };

  const handleDownloadDashboardPdf = async () => {
    if (!filters.manufacturingPlantId || isDownloadingPdfReport) {
      return;
    }

    setIsDownloadingPdfReport(true);

    try {
      const visibleCharts = Array.from(
        document.querySelectorAll<HTMLElement>(
          "[data-dashboard-export='chart']",
        ),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 && rect.height > 0 && element.offsetParent !== null
        );
      });

      if (!visibleCharts.length) {
        toast.error("No hay gráficas visibles para exportar");
        return;
      }

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const title = "Informe de Dashboard de Hallazgos";
      const generatedAt = `Generado: ${dayjs().format("DD/MM/YYYY HH:mm")}`;
      const plantLabel = filters.manufacturingPlantName
        ? `Planta: ${filters.manufacturingPlantName}`
        : "Planta: Sin especificar";

      pdf.setFontSize(16);
      pdf.text(title, margin, margin + 2);

      pdf.setFontSize(10);
      pdf.text(generatedAt, margin, margin + 10);
      pdf.text(plantLabel, margin, margin + 16);

      const summaryLines = pdf.splitTextToSize(
        `Filtros: ${heatmapFiltersTitle || "Sin filtros adicionales"}`,
        maxWidth,
      );
      pdf.text(summaryLines, margin, margin + 22);

      let currentY = margin + 22 + summaryLines.length * 4 + 4;
      const sectionGap = 6;
      const maxChartsPerPage = 2;
      let chartsInCurrentPage = 0;

      for (let index = 0; index < visibleCharts.length; index += 1) {
        if (chartsInCurrentPage >= maxChartsPerPage) {
          pdf.addPage();
          currentY = margin;
          chartsInCurrentPage = 0;
        }

        const chartElement = visibleCharts[index];
        const canvas = await html2canvas(chartElement, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
        });

        const imageData = canvas.toDataURL("image/png");

        let renderWidth = maxWidth;
        let renderHeight = (canvas.height * renderWidth) / canvas.width;
        const availableHeight = pageHeight - margin - currentY;

        if (renderHeight > availableHeight) {
          if (availableHeight < 40) {
            pdf.addPage();
            currentY = margin;
            chartsInCurrentPage = 0;
            renderHeight = (canvas.height * renderWidth) / canvas.width;
          }

          const refreshedAvailableHeight = pageHeight - margin - currentY;
          if (renderHeight > refreshedAvailableHeight) {
            renderHeight = refreshedAvailableHeight;
            renderWidth = (canvas.width * renderHeight) / canvas.height;
          }
        }

        if (renderHeight <= 0) {
          pdf.addPage();
          currentY = margin;
          chartsInCurrentPage = 0;
          renderWidth = maxWidth;
          renderHeight = (canvas.height * renderWidth) / canvas.width;
        }

        const x = (pageWidth - renderWidth) / 2;
        pdf.addImage(imageData, "PNG", x, currentY, renderWidth, renderHeight);
        currentY += renderHeight + sectionGap;
        chartsInCurrentPage += 1;

        if (
          index < visibleCharts.length - 1 &&
          currentY >= pageHeight - margin
        ) {
          pdf.addPage();
          currentY = margin;
          chartsInCurrentPage = 0;
        }
      }

      pdf.save(`Informe_Dashboard_${dayjs().format("YYYYMMDD_HHmm")}.pdf`);
    } catch {
      toast.error("No se pudo generar el informe PDF");
    } finally {
      setIsDownloadingPdfReport(false);
    }
  };

  if (email === "cosmeticostrujillo0023@gmail.com") {
    return window.location.replace("/hds");
  }

  return (
    <Grid key={chartsMode} container spacing={2}>
      <Typography component="h1" sx={visuallyHidden}>
        Dashboard de hallazgos
      </Typography>
      {isHistoricalView ? (
        <>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Button
              variant="contained"
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() => setIsHistoricalView(false)}
            >
              Regresar
            </Button>
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
              parseDate={parseDate}
              handlePlantChange={handlePlantChange}
              handleToggleHeatmapView={handleToggleHeatmapView}
              handleBackToInitialCharts={handleBackToInitialCharts}
              handleGoToHallazgos={handleGoToHallazgos}
              handleDownloadDashboardPdf={handleDownloadDashboardPdf}
            />
          </Grid>

          {!showCharts && (
            <Grid size={{ xs: 12 }}>
              {screenState === "loading" ? (
                <Box role="status" aria-label="Cargando gráficas">
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
                    offline={
                      typeof navigator !== "undefined" && !navigator.onLine
                    }
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
                        Ver los últimos {WIDER_PERIOD_DAYS} días
                      </Button>
                    </EmptyState>
                  ) : (
                    <EmptyState
                      title="Sin hallazgos en este periodo"
                      description={`No hay hallazgos de ${filters.manufacturingPlantName || "la planta"} del ${filters.startDate} al ${filters.endDate}${hasExtraFilters ? " con los filtros elegidos" : ""}.`}
                    >
                      {hasExtraFilters && (
                        <Button variant="outlined" onClick={clearExtraFilters}>
                          Quitar zonas, responsables y clasificación
                        </Button>
                      )}
                      <Button variant="outlined" onClick={widenPeriod}>
                        Ver los últimos {WIDER_PERIOD_DAYS} días
                      </Button>
                    </EmptyState>
                  )}
                </Paper>
              )}
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
                imageSrc="/images/planos.png"
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
                <StatusChart filters={filters} />
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
                <AreasChart filters={filters} />
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
              <Paper sx={{ minHeight: 470, p: 2 }}>
                <MainTypesChart filters={filters} />
              </Paper>
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
              <Paper sx={{ minHeight: 470, p: 2 }}>
                <SolidGaugeMultiKpiChart filters={filters} />
              </Paper>
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
              <PriorityInterventionChart filters={filters} />
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
              <RiskLevelChart filters={filters} />
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
              <Paper sx={{ minHeight: 470, p: 2 }}>
                <AreaRangeLineChart filters={filters} />
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
              <Paper sx={{ minHeight: 560, p: 2 }}>
                <PackedBubbleChart filters={filters} />
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
              <Paper sx={{ minHeight: 560, p: 2 }}>
                <SankeyDiagramChart filters={filters} />
              </Paper>
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
              <Paper sx={{ minHeight: 400, p: 2 }}>
                <AssignedResponsibleChart filters={filters} />
              </Paper>
            </Grid>
          )}
        </>
      )}

      <Zoom in={true}>
        <Fab
          color="primary"
          size="medium"
          aria-label="Volver arriba"
          onClick={handleScrollTop}
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            // Por encima de los botones del sistema (viewport-fit=cover).
            bottom: {
              xs: "calc(16px + env(safe-area-inset-bottom, 0px))",
              sm: "calc(24px + env(safe-area-inset-bottom, 0px))",
            },
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Grid>
  );
};

export default DashboardPage;
