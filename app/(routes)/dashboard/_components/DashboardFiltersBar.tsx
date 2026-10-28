"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Area, MainType } from "@interfaces";
import dayjs, { Dayjs } from "dayjs";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  SelectChangeEvent,
  Stack,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { UserOption } from "@interfaces";
import FilterBar, {
  compactFilters,
  joinNames,
} from "@shared/components/FilterBar";
import "dayjs/locale/es";

export interface DashboardFilters {
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

interface DashboardFiltersBarProps {
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  areas: Area[];
  availableMainTypes: MainType[];
  sortedResponsibles: UserOption[];
  isHeatmapView: boolean;
  setIsHeatmapView: Dispatch<SetStateAction<boolean>>;
  setIsHistoricalView: Dispatch<SetStateAction<boolean>>;
  isDownloadingPdfReport: boolean;
  // Hay gráficas en pantalla (sin datos o con error no hay qué exportar).
  canDownloadPdf: boolean;
  parseDate: (value: string) => Dayjs | null;
  handlePlantChange: (event: SelectChangeEvent<string>) => void;
  handleToggleHeatmapView: () => void;
  handleBackToInitialCharts: () => void;
  handleGoToHallazgos: () => void;
  handleDownloadDashboardPdf: () => Promise<void>;
}

/** Barra de filtros del dashboard; el estado vive en la página. */
export const DashboardFiltersBar = ({
  filters,
  setFilters,
  areas,
  availableMainTypes,
  sortedResponsibles,
  isHeatmapView,
  setIsHeatmapView,
  setIsHistoricalView,
  isDownloadingPdfReport,
  canDownloadPdf,
  parseDate,
  handlePlantChange,
  handleToggleHeatmapView,
  handleBackToInitialCharts,
  handleGoToHallazgos,
  handleDownloadDashboardPdf,
}: DashboardFiltersBarProps) => {
  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: filters.manufacturingPlantName || "…",
      onRemove: () =>
        handlePlantChange({
          target: { value: "" },
        } as SelectChangeEvent<string>),
    },
    !!filters.startDate && {
      key: "startDate",
      label: "Desde",
      value: filters.startDate,
      onRemove: () => setFilters((prev) => ({ ...prev, startDate: "" })),
    },
    !!filters.endDate && {
      key: "endDate",
      label: "Hasta",
      value: filters.endDate,
      onRemove: () => setFilters((prev) => ({ ...prev, endDate: "" })),
    },
    filters.areaIds.length > 0 && {
      key: "areaIds",
      label: "Zonas",
      value: joinNames(filters.areaNames),
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          areaIds: [],
          areaNames: [],
          responsibleIds: [],
          responsibleNames: [],
        })),
    },
    filters.responsibleIds.length > 0 && {
      key: "responsibleIds",
      label: "Responsables",
      value: joinNames(filters.responsibleNames),
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          responsibleIds: [],
          responsibleNames: [],
        })),
    },
    filters.mainTypeIds.length > 0 && {
      key: "mainTypeIds",
      label: "Clasificación",
      value: joinNames(filters.mainTypeNames),
      onRemove: () =>
        setFilters((prev) => ({
          ...prev,
          mainTypeIds: [],
          mainTypeNames: [],
        })),
    },
  );

  return (
    <FilterBar
      activeFilters={activeFilters}
      sx={{ mb: 0, bgcolor: "background.paper" }}
      actions={
        <Stack
          direction="row"
          spacing={{ xs: 0, sm: 1 }}
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

          {canDownloadPdf && (
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
      }
    >
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
              esES.components.MuiLocalizationProvider.defaultProps.localeText
            }
          >
            <DatePicker
              label="Fecha inicio"
              format="DD/MM/YYYY"
              value={parseDate(filters.startDate)}
              maxDate={parseDate(filters.endDate) || dayjs().endOf("month")}
              onChange={(newValue: Dayjs | null) => {
                // Al escribirla, la fecha pasa por valores incompletos
                // ("Invalid Date") que el API rechaza: se ignoran.
                if (newValue && !newValue.isValid()) return;
                setFilters((prev) => ({
                  ...prev,
                  startDate: newValue ? newValue.format("DD/MM/YYYY") : "",
                }));
              }}
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
              esES.components.MuiLocalizationProvider.defaultProps.localeText
            }
          >
            <DatePicker
              label="Fecha fin"
              format="DD/MM/YYYY"
              value={parseDate(filters.endDate)}
              minDate={parseDate(filters.startDate) || undefined}
              maxDate={dayjs()}
              onChange={(newValue: Dayjs | null) => {
                if (newValue && !newValue.isValid()) return;
                setFilters((prev) => ({
                  ...prev,
                  endDate: newValue ? newValue.format("DD/MM/YYYY") : "",
                }));
              }}
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
                !filters.manufacturingPlantId ? "Seleccione una planta" : ""
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
                !filters.manufacturingPlantId ? "Seleccione una planta" : ""
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
    </FilterBar>
  );
};
