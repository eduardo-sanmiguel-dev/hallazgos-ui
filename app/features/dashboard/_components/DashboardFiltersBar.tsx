import { STATUS_OPEN, STATUS_IN_PROGRESS, STATUS_CLOSED } from "@shared/constants";
import { useTheme } from "@mui/material/styles";
import { evidenceStatusColor, STATUS_CANCELLED } from "@shared/constants/semanticTones";
import type { Dispatch, SetStateAction } from "react";
import type { Area, MainType } from "@interfaces";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import WhatshotOutlinedIcon from "@mui/icons-material/WhatshotOutlined";
import {
  Box,
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
import FilterBar, { compactFilters, joinNames } from "@shared/components/FilterBar";
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
  states: string[];
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
  const themeMode = useTheme().palette.mode;
  const statusOptions = [STATUS_OPEN, STATUS_IN_PROGRESS, STATUS_CLOSED, STATUS_CANCELLED].map(
    (status) => ({
      id: status,
      name: status,
      color: evidenceStatusColor(status, themeMode),
    }),
  );
  const activeFilters = compactFilters(
    filters.states.length > 0 && {
      key: "states",
      label: "Estatus",
      value: joinNames(filters.states),
      onRemove: () => setFilters((prev) => ({ ...prev, states: [] })),
    },
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
            : (PERIOD_PRESETS.find(({ value }) => value === filters.periodPreset)?.label ??
              `${filters.startDate} – ${filters.endDate}`),
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
      sx={{
        mb: 0,
        bgcolor: "background.paper",
        // En celular, las acciones tienen su fila para conservar el titulo y el control de apertura.
        "& > .MuiBox-root:first-of-type": {
          flexWrap: { xs: "wrap", sm: "nowrap" },
          "& > .MuiTypography-root": { flexBasis: { xs: "100%", sm: "auto" } },
          "& > .MuiStack-root": {
            width: { xs: "100%", sm: "auto" },
            px: { xs: 1, sm: 0 },
            pb: { xs: 1, sm: 0 },
          },
        },
      }}
      actions={
        <Stack
          direction="row"
          spacing={{ xs: 0, sm: 1 }}
          sx={{
            justifyContent: "flex-end",
            "& .MuiIconButton-root": {
              minWidth: { xs: 44, sm: 40 },
              minHeight: { xs: 44, sm: 40 },
            },
          }}
        >
          <Tooltip title="Ir a Hallazgos" arrow>
            <IconButton color="primary" aria-label="Ir a Hallazgos" onClick={handleGoToHallazgos}>
              <AssignmentOutlinedIcon />
            </IconButton>
          </Tooltip>

          {canDownloadPdf && (
            <Tooltip
              title={isDownloadingPdfReport ? "Generando informe..." : "Descargar informe PDF"}
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
              <IconButton color="primary" aria-label="Gráficas" onClick={handleBackToInitialCharts}>
                <BarChartOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <Grid size={{ xs: 12 }} sx={{ containerType: "inline-size" }}>
        <Box
          sx={{
            display: "grid",
            alignItems: "start",
            gap: 2,
            gridTemplateColumns: "minmax(0, 1fr)",
            "& > *": { minWidth: 0, width: "100%" },
            "@container (min-width: 520px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
            "@container (min-width: 840px)": {
              gridTemplateColumns:
                filters.periodPreset === "custom"
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
            },
            "@container (min-width: 1120px)": {
              gridTemplateColumns:
                filters.periodPreset === "custom"
                  ? "repeat(4, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
            },
            "@container (min-width: 1440px)": {
              gridTemplateColumns:
                filters.periodPreset === "custom"
                  ? "repeat(4, minmax(0, 1fr))"
                  : "repeat(6, minmax(0, 1fr))",
            },
          }}
        >
          <SelectManufacturingPlantsOwn
            value={filters.manufacturingPlantId}
            onChange={handlePlantChange}
            isFilter={true}
            size={12}
          />

          <PeriodFilter
            inGrid
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

          <Box>
            <SelectDefault
              data={statusOptions}
              label="Estatus"
              multiple={true}
              isFilter={true}
              value={filters.states}
              onChange={(_, newValue) =>
                setFilters((prev) => ({
                  ...prev,
                  states: Array.isArray(newValue) ? newValue.map((item) => String(item.id)) : [],
                }))
              }
            />
          </Box>
          <Box>
            <SelectDefault
              data={areas}
              label="Zonas"
              multiple={true}
              isFilter={true}
              value={filters.areaIds}
              onChange={(_, newValue) =>
                setFilters((prev) => ({
                  ...prev,
                  areaIds: Array.isArray(newValue) ? newValue.map((item) => String(item.id)) : [],
                  areaNames: Array.isArray(newValue) ? newValue.map((item) => item.name) : [],
                  responsibleIds: [],
                  responsibleNames: [],
                }))
              }
              helperText={!filters.manufacturingPlantId ? "Seleccione una planta" : ""}
            />
          </Box>

          <Box>
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
              helperText={!filters.manufacturingPlantId ? "Seleccione una planta" : ""}
            />
          </Box>

          <Box>
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
                  mainTypeNames: Array.isArray(newValue) ? newValue.map((item) => item.name) : [],
                }))
              }
            />
          </Box>
        </Box>
      </Grid>
    </FilterBar>
  );
};
