"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import {
  Button,
  CircularProgress,
  Fab,
  Grid,
  IconButton,
  Paper,
  SelectChangeEvent,
  Stack,
  Tooltip,
  Zoom,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { Area, ResponseDashboardHeatmapByFilters, User } from "@interfaces";
import { AreasService, DashboardService, UsersService } from "@services";
import { useCategoriesStore, useUserSessionStore } from "@store";
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

interface DashboardFilters {
  manufacturingPlantId: string;
  manufacturingPlantName: string;
  startDate: string;
  endDate: string;
  areaIds: string[];
  areaNames: string[];
  responsibleIds: string[];
  responsibleNames: string[];
  mainTypeIds: string[];
  mainTypeNames: string[];
}

const restrictedDashboardEmail = "glora@hadainternational.com";

const DashboardPage = () => {
  const router = useRouter();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants || [],
  );

  const email = useUserSessionStore((state) => state.email);

  const currentMonthStart = dayjs().startOf("month").format("DD/MM/YYYY");
  const currentMonthEnd = dayjs().format("DD/MM/YYYY");

  const [filters, setFilters] = useState<DashboardFilters>({
    manufacturingPlantId: "",
    manufacturingPlantName: "",
    startDate: currentMonthStart,
    endDate: currentMonthEnd,
    areaIds: [],
    areaNames: [],
    responsibleIds: [],
    responsibleNames: [],
    mainTypeIds: [],
    mainTypeNames: [],
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [responsibles, setResponsibles] = useState<User[]>([]);
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

  const { mainTypes } = useCategoriesStore();
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

  useEffect(() => {
    if (!filters.manufacturingPlantId) {
      setAreas([]);
      return;
    }

    AreasService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
    }).then(setAreas);

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
    <Grid container spacing={2}>
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
            sx={{
              position: "sticky",
              top: {
                xs: 56,
                sm: 80,
              },
              zIndex: (theme) => theme.zIndex.appBar - 1,
            }}
          >
            <Paper
              sx={{
                p: 1,
                backdropFilter: "blur(8px)",
                bgcolor: "background.paper",
                border: "2px solid",
                borderColor: "primary.main",
              }}
            >
              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <SelectManufacturingPlantsOwn
                  value={filters.manufacturingPlantId}
                  onChange={handlePlantChange}
                  isFilter={true}
                />

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 2,
                  }}
                >
                  <Paper>
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                      localeText={
                        esES.components.MuiLocalizationProvider.defaultProps
                          .localeText
                      }
                    >
                      <DatePicker
                        label="Fecha inicio"
                        format="DD/MM/YYYY"
                        value={parseDate(filters.startDate)}
                        maxDate={
                          parseDate(filters.endDate) || dayjs().endOf("month")
                        }
                        onChange={(newValue: Dayjs | null) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: newValue
                              ? newValue.format("DD/MM/YYYY")
                              : "",
                          }))
                        }
                        slotProps={{
                          field: {
                            clearable: true,
                            onClear: () =>
                              setFilters((prev) => ({
                                ...prev,
                                startDate: "",
                              })),
                          },
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Paper>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 2,
                  }}
                >
                  <Paper>
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                      localeText={
                        esES.components.MuiLocalizationProvider.defaultProps
                          .localeText
                      }
                    >
                      <DatePicker
                        label="Fecha fin"
                        format="DD/MM/YYYY"
                        value={parseDate(filters.endDate)}
                        minDate={parseDate(filters.startDate) || undefined}
                        maxDate={dayjs()}
                        onChange={(newValue: Dayjs | null) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: newValue
                              ? newValue.format("DD/MM/YYYY")
                              : "",
                          }))
                        }
                        slotProps={{
                          field: {
                            clearable: true,
                            onClear: () =>
                              setFilters((prev) => ({
                                ...prev,
                                endDate: "",
                              })),
                          },
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Paper>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 1,
                  }}
                  sx={{
                    ml: { md: "auto" },
                    display: "flex",
                    justifyContent: { xs: "flex-end", md: "flex-end" },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Ir a Hallazgos" arrow>
                      <IconButton
                        color="primary"
                        aria-label="Ir a Hallazgos"
                        onClick={handleGoToHallazgos}
                      >
                        <AssignmentOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    {!!filters.manufacturingPlantId && (
                      <Tooltip
                        title={
                          isDownloadingPdfReport
                            ? "Generando informe..."
                            : "Descargar informe PDF"
                        }
                        arrow
                      >
                        <IconButton
                          color="primary"
                          aria-label="Descargar informe PDF"
                          onClick={handleDownloadDashboardPdf}
                          disabled={isDownloadingPdfReport}
                        >
                          {isDownloadingPdfReport ? (
                            <CircularProgress size={22} color="inherit" />
                          ) : (
                            <PictureAsPdfOutlinedIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Histórico" arrow>
                      <IconButton
                        color="primary"
                        aria-label="Histórico"
                        onClick={() => {
                          setIsHeatmapView(false);
                          setIsHistoricalView(true);
                        }}
                      >
                        <HistoryOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    {!isHeatmapView ? (
                      <Tooltip title="Mapa de calor" arrow>
                        <IconButton
                          color="primary"
                          aria-label="Mapa de calor"
                          onClick={handleToggleHeatmapView}
                        >
                          <WhatshotOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Gráficas" arrow>
                        <IconButton
                          color="primary"
                          aria-label="Gráficas"
                          onClick={handleBackToInitialCharts}
                        >
                          <BarChartOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                        md: 4,
                      }}
                    >
                      <SelectDefault
                        data={areas}
                        label="Zonas"
                        multiple={true}
                        isFilter={true}
                        value={filters.areaIds}
                        onChange={(_, newValue) =>
                          setFilters((prev) => ({
                            ...prev,
                            areaIds: Array.isArray(newValue)
                              ? newValue.map((item) => String(item.id))
                              : [],
                            areaNames: Array.isArray(newValue)
                              ? newValue.map((item) => item.name)
                              : [],
                            responsibleIds: [],
                            responsibleNames: [],
                          }))
                        }
                        helperText={
                          !filters.manufacturingPlantId
                            ? "Seleccione una planta"
                            : ""
                        }
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                        md: 4,
                      }}
                    >
                      <SelectDefault
                        data={sortedResponsibles}
                        label="Responsables"
                        multiple={true}
                        isFilter={true}
                        value={filters.responsibleIds}
                        onChange={(_, newValue) =>
                          setFilters((prev) => ({
                            ...prev,
                            responsibleIds: Array.isArray(newValue)
                              ? newValue.map((item) => String(item.id))
                              : [],
                            responsibleNames: Array.isArray(newValue)
                              ? newValue.map((item) => item.name)
                              : [],
                          }))
                        }
                        helperText={
                          !filters.manufacturingPlantId
                            ? "Seleccione una planta"
                            : ""
                        }
                      />
                    </Grid>

                    <Grid
                      size={{
                        xs: 12,
                        sm: 6,
                        md: 4,
                      }}
                    >
                      <SelectDefault
                        data={availableMainTypes}
                        label="Clasificación"
                        multiple={true}
                        isFilter={true}
                        value={filters.mainTypeIds}
                        onChange={(_, newValue) =>
                          setFilters((prev) => ({
                            ...prev,
                            mainTypeIds: Array.isArray(newValue)
                              ? newValue.map((item) => String(item.id))
                              : [],
                            mainTypeNames: Array.isArray(newValue)
                              ? newValue.map((item) => item.name)
                              : [],
                          }))
                        }
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {isHeatmapView && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && !shouldHideProjectionCharts && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && !shouldHideProjectionCharts && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && (
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

          {!isHeatmapView && (
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
            bottom: { xs: 16, sm: 24 },
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
