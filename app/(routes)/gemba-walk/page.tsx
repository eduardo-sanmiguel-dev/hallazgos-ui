"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useDebouncedCallback } from "use-debounce";
import moment from "moment-timezone";

import LoadingLinear from "@shared/components/LoadingLinear";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { GembaWalksService, GembaWalkZonesService } from "@services";
import { GembaWalk, GembaWalkZone } from "@interfaces";
import { useUserSessionStore } from "@store";
import GembaWalkAccessGuard from "./_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import TableGembaWalks from "./_components/TableGembaWalks";
import DateFieldDMY from "./calendar/_components/DateFieldDMY";

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
  startDate: moment().startOf("month").format("YYYY-MM-DD"),
  endDate: moment().endOf("month").format("YYYY-MM-DD"),
  nameZone: "",
  nameLocation: "",
  isAdditional: "",
});

const GembaWalksList = () => {
  const [data, setData] = useState<GembaWalk[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [zones, setZones] = useState<GembaWalkZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState(defaultFilters);

  const hasFiltersToClear = useMemo(() => {
    const defaults = defaultFilters();
    return (Object.keys(defaults) as (keyof typeof defaults)[]).some(
      (key) => filters[key] !== defaults[key],
    );
  }, [filters]);

  const router = useRouter();

  const userPlants = useUserSessionStore((state) => state.manufacturingPlants);

  useEffect(() => {
    GembaWalkZonesService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
    }).then(setZones);
  }, [filters.manufacturingPlantId]);

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

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    // Días locales del filtro; endDate se envía exclusivo (día siguiente).
    GembaWalksService.findAllPaginated({
      page: page + 1,
      limit: rowsPerPage,
      manufacturingPlantId: filters.manufacturingPlantId,
      nameZone: filters.nameZone,
      nameLocation: filters.nameLocation,
      isAdditional: filters.isAdditional,
      ...(filters.startDate && {
        startDate: moment(filters.startDate, "YYYY-MM-DD").toISOString(),
      }),
      ...(filters.endDate && {
        endDate: moment(filters.endDate, "YYYY-MM-DD")
          .add(1, "day")
          .toISOString(),
      }),
    })
      .then(({ data, count }) => {
        setData(data);
        setCount(count);
      })
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/form")}
        >
          Registrar recorrido
        </Button>
        <Button
          variant="outlined"
          startIcon={<CalendarMonthIcon />}
          onClick={() => router.push("/gemba-walk/schedule")}
        >
          Ver calendario
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <RefreshButton onClick={() => getData()} />
      </Box>
      <FilterBar count={count}>
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
            onChange={(endDate) =>
              setFilters((prev) => ({ ...prev, endDate }))
            }
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
        <TableGembaWalks
          rows={data}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={count}
        />
      )}
    </>
  );
};

const GembaWalksPage = () => (
  <>
    <PageHeader title="Gemba Walk - Recorridos" />
    <GembaWalkAccessGuard>
      <GembaWalksList />
    </GembaWalkAccessGuard>
  </>
);

export default GembaWalksPage;
