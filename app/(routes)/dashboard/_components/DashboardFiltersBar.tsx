"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Area, MainType } from "@interfaces";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import {
  CircularProgress,
  Grid,
  IconButton,
  SelectChangeEvent,
  Stack,
  Tooltip,
} from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { UserOption } from "@interfaces";
import FilterBar, {
  compactFilters,
  joinNames,
} from "@shared/components/FilterBar";
import PeriodFilter from "@shared/components/PeriodFilter";
import { PERIOD_PRESETS, type PeriodPreset } from "@shared/utils/period";

export interface DashboardFilters {
  manufacturingPlantId: string;
  manufacturingPlantName: string;
  // Atajo del periodo (como en el análisis EPP); las fechas son su rango.
  periodPreset: PeriodPreset;
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
    // Un solo filtro de periodo (antes "Desde" y "Hasta"). Sin quitar: el
    // dashboard siempre necesita uno.
    !!filters.startDate &&
      !!filters.endDate && {
        key: "period",
        label: "Periodo",
        value:
          filters.periodPreset === "custom"
            ? `${filters.startDate} – ${filters.endDate}`
            : (PERIOD_PRESETS.find(
                ({ value }) => value === filters.periodPreset,
              )?.label ?? `${filters.startDate} – ${filters.endDate}`),
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

      {/* Atajos y "Personalizado" (Desde / Hasta), como el análisis EPP.
          Antes, dos fechas sueltas. */}
      <Grid size={{ xs: 12, md: "grow" }}>
        <PeriodFilter
          value={{
            preset: filters.periodPreset,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          onChange={({ preset, startDate, endDate }) =>
            setFilters((prev) => ({
              ...prev,
              periodPreset: preset,
              startDate,
              endDate,
            }))
          }
        />
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
