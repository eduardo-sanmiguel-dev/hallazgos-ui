"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Grid } from "@mui/material";
import { Box } from "@mui/material";
import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs, { toISOStringOrNull } from "@shared/libs/dayjs";

import { EMPTY_CATALOG, useGembaWalkZones, usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { GembaWalksService } from "@services";
import { useUserSessionStore } from "@store";
import GembaWalkAccessGuard from "./_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar, {
  compactFilters,
  formatDateDMY,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import TableGembaWalks from "./_components/TableGembaWalks";
import DateFieldDMY from "./calendar/_components/DateFieldDMY";

const TITLE = "Gemba Walk - Recorridos";

// En celular los tres botones de la cabecera caben en una fila con el texto
// corto.
const ResponsiveLabel = ({ short, full }: { short: string; full: string }) => (
  <>
    <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
      {short}
    </Box>
    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
      {full}
    </Box>
  </>
);

const ADDITIONAL_OPTIONS = [
  { id: "true", name: "Sí" },
  { id: "false", name: "No" },
];

// Opciones únicas y ordenadas para un select a partir de nombres.
const toOptions = (names: string[]) =>
  [...new Set(names.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ id: name, name }));

// Filtros por defecto: mes en curso, sin más criterios.
const defaultFilters = () => ({
  manufacturingPlantId: "",
  startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  nameZone: "",
  nameLocation: "",
  isAdditional: "",
});

const GembaWalksList = () => {
  const [filters, setFilters] = useState(defaultFilters);

  const hasFiltersToClear = useMemo(() => {
    const defaults = defaultFilters();
    return (Object.keys(defaults) as (keyof typeof defaults)[]).some(
      (key) => filters[key] !== defaults[key],
    );
  }, [filters]);

  const router = useRouter();

  const userPlants = useUserSessionStore((state) => state.manufacturingPlants);

  const zones =
    useGembaWalkZones({ manufacturingPlantId: filters.manufacturingPlantId })
      .data ?? EMPTY_CATALOG;

  // Solo zonas de las plantas del usuario.
  const ownZones = useMemo(() => {
    const plantIds = new Set((userPlants || []).map(({ id }) => id));
    return zones.filter(({ manufacturingPlant }) =>
      plantIds.has(manufacturingPlant?.id),
    );
  }, [zones, userPlants]);

  const zoneOptions = useMemo(
    () => toOptions(ownZones.map(({ nameZone }) => nameZone)),
    [ownZones],
  );

  // Las ubicaciones se acotan a la zona elegida.
  const locationOptions = useMemo(
    () =>
      toOptions(
        ownZones
          .filter(
            ({ nameZone }) =>
              !filters.nameZone || nameZone === filters.nameZone,
          )
          .map(({ nameLocation }) => nameLocation),
      ),
    [ownZones, filters.nameZone],
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk",
    filters,
    fetcher: (filters, { page, limit }) =>
      // Días locales del filtro; endDate se envía exclusivo (día siguiente).
      GembaWalksService.findAllPaginated({
        page,
        limit,
        manufacturingPlantId: filters.manufacturingPlantId,
        nameZone: filters.nameZone,
        nameLocation: filters.nameLocation,
        isAdditional: filters.isAdditional,
        ...(filters.startDate && {
          startDate: toISOStringOrNull(dayjs(filters.startDate, "YYYY-MM-DD")),
        }),
        ...(filters.endDate && {
          endDate: toISOStringOrNull(
            dayjs(filters.endDate, "YYYY-MM-DD").add(1, "day"),
          ),
        }),
      }),
  });

  return (
    <>
      <PageHeader title={TITLE}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/form")}
        >
          <ResponsiveLabel short="Registrar" full="Registrar recorrido" />
        </Button>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => router.push("/gemba-walk/schedule")}
        >
          <ResponsiveLabel short="Calendario" full="Ver calendario" />
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar
        count={count}
        activeFilters={compactFilters(
          !!filters.manufacturingPlantId && {
            key: "manufacturingPlantId",
            label: "Planta",
            value: optionLabel(filters.manufacturingPlantId, userPlants ?? []),
            onRemove: () =>
              setFilters((prev) => ({
                ...prev,
                manufacturingPlantId: "",
                nameZone: "",
                nameLocation: "",
              })),
          },
          !!filters.startDate && {
            key: "startDate",
            label: "Desde",
            value: formatDateDMY(filters.startDate),
            onRemove: () => setFilters((prev) => ({ ...prev, startDate: "" })),
          },
          !!filters.endDate && {
            key: "endDate",
            label: "Hasta",
            value: formatDateDMY(filters.endDate),
            onRemove: () => setFilters((prev) => ({ ...prev, endDate: "" })),
          },
          !!filters.nameZone && {
            key: "nameZone",
            label: "Zona",
            value: filters.nameZone,
            onRemove: () =>
              setFilters((prev) => ({
                ...prev,
                nameZone: "",
                nameLocation: "",
              })),
          },
          !!filters.nameLocation && {
            key: "nameLocation",
            label: "Ubicación",
            value: filters.nameLocation,
            onRemove: () =>
              setFilters((prev) => ({ ...prev, nameLocation: "" })),
          },
          !!filters.isAdditional && {
            key: "isAdditional",
            label: "Adicional",
            value: optionLabel(filters.isAdditional, ADDITIONAL_OPTIONS),
            onRemove: () =>
              setFilters((prev) => ({ ...prev, isAdditional: "" })),
          },
        )}
        onClearAll={() => setFilters(defaultFilters())}
      >
        <ClearFiltersButton
          visible={hasFiltersToClear}
          onClick={() => setFilters(defaultFilters())}
        />
        <SelectManufacturingPlantsOwn
          value={filters.manufacturingPlantId}
          onChange={(e) =>
            setFilters((prev) =>
              prev.manufacturingPlantId === e.target.value
                ? prev
                : {
                    ...prev,
                    manufacturingPlantId: e.target.value,
                    nameZone: "",
                    nameLocation: "",
                  },
            )
          }
          isFilter={true}
        />
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DateFieldDMY
            label="Desde"
            value={filters.startDate}
            onChange={(startDate) =>
              setFilters((prev) => ({ ...prev, startDate }))
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DateFieldDMY
            label="Hasta"
            value={filters.endDate}
            onChange={(endDate) => setFilters((prev) => ({ ...prev, endDate }))}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SelectDefault
            data={zoneOptions}
            label="Zona"
            value={filters.nameZone}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                nameZone: e.target.value,
                nameLocation: "",
              }))
            }
            isFilter={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SelectDefault
            data={locationOptions}
            label="Ubicación"
            value={filters.nameLocation}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, nameLocation: e.target.value }))
            }
            isFilter={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SelectDefault
            data={ADDITIONAL_OPTIONS}
            label="Adicional"
            value={filters.isAdditional}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, isAdditional: e.target.value }))
            }
            isFilter={true}
          />
        </Grid>
      </FilterBar>
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalks rows={data} pagination={pagination} />
      )}
    </>
  );
};

const GembaWalksPage = () => (
  <GembaWalkAccessGuard title={TITLE}>
    <GembaWalksList />
  </GembaWalkAccessGuard>
);

export default GembaWalksPage;
