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
import { User } from "@interfaces";
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
  sortedResponsibles: User[];
  isHeatmapView: boolean;
  setIsHeatmapView: Dispatch<SetStateAction<boolean>>;
  setIsHistoricalView: Dispatch<SetStateAction<boolean>>;
  isDownloadingPdfReport: boolean;
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
  parseDate,
  handlePlantChange,
  handleToggleHeatmapView,
  handleBackToInitialCharts,
  handleGoToHallazgos,
  handleDownloadDashboardPdf,
}: DashboardFiltersBarProps) => (
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
          sm: 6,
          md: 1,
        }}
        sx={{
          ml: { md: "auto" },
          display: "flex",
          justifyContent: { xs: "flex-end", md: "flex-end" },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
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
    </Grid>
  </Paper>
);
