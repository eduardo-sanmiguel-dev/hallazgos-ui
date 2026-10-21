import { useMemo } from "react";

import { Grid } from "@mui/material";

import { useGembaWalkZones } from "@hooks";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import DateFieldDMY from "./DateFieldDMY";

import FilterBar, {
  compactFilters,
  formatDateDMY,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersGembaWalkCalendar {
  manufacturingPlantId: string;
  gembaWalkZoneId: string;
  // YYYY-MM-DD (días locales, ambos inclusivos)
  startDate: string;
  endDate: string;
  // "true" | "false" | "" (todos)
  isAdditional: string;
}

const ADDITIONAL_OPTIONS = [
  { id: "true", name: "Sí" },
  { id: "false", name: "No" },
];

interface Props {
  filters: IFiltersGembaWalkCalendar;
  setFilters: (filters: IFiltersGembaWalkCalendar) => void;
  count: number;
  // Visible cuando algún filtro difiere del valor por defecto.
  canClear?: boolean;
  onClear?: () => void;
}

const FiltersGembaWalkCalendar = ({
  filters,
  setFilters,
  count,
  canClear = false,
  onClear,
}: Props) => {
  const { data: gembaZones } = useGembaWalkZones(
    { manufacturingPlantId: filters.manufacturingPlantId },
    { enabled: !!filters.manufacturingPlantId },
  );

  const zones = useMemo(
    () =>
      (gembaZones ?? []).map((zone) => ({
        id: zone.id,
        name: `${zone.nameZone} - ${zone.nameLocation}`,
      })),
    [gembaZones],
  );

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () =>
        setFilters({
          ...filters,
          manufacturingPlantId: "",
          gembaWalkZoneId: "",
        }),
    },
    !!filters.gembaWalkZoneId && {
      key: "gembaWalkZoneId",
      label: "Zona",
      value: optionLabel(filters.gembaWalkZoneId, zones),
      onRemove: () => setFilters({ ...filters, gembaWalkZoneId: "" }),
    },
    !!filters.startDate && {
      key: "startDate",
      label: "Desde",
      value: formatDateDMY(filters.startDate),
      onRemove: () => setFilters({ ...filters, startDate: "" }),
    },
    !!filters.endDate && {
      key: "endDate",
      label: "Hasta",
      value: formatDateDMY(filters.endDate),
      onRemove: () => setFilters({ ...filters, endDate: "" }),
    },
    !!filters.isAdditional && {
      key: "isAdditional",
      label: "Adicional",
      value: optionLabel(filters.isAdditional, ADDITIONAL_OPTIONS),
      onRemove: () => setFilters({ ...filters, isAdditional: "" }),
    },
  );

  return (
    <FilterBar count={count} activeFilters={activeFilters} onClearAll={onClear}>
      <ClearFiltersButton visible={canClear} onClick={() => onClear?.()} />
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) =>
          setFilters({
            ...filters,
            manufacturingPlantId: e.target.value,
            gembaWalkZoneId: "",
          })
        }
        isFilter={true}
      />
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectDefault
          data={zones}
          label="Zona"
          value={filters.gembaWalkZoneId}
          onChange={(e) =>
            setFilters({
              ...filters,
              gembaWalkZoneId: e.target.value,
            })
          }
          isFilter={true}
          disabled={!filters.manufacturingPlantId}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <DateFieldDMY
          label="Desde"
          value={filters.startDate}
          onChange={(value) =>
            setFilters({
              ...filters,
              startDate: value,
            })
          }
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <DateFieldDMY
          label="Hasta"
          value={filters.endDate}
          onChange={(value) =>
            setFilters({
              ...filters,
              endDate: value,
            })
          }
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectDefault
          data={ADDITIONAL_OPTIONS}
          label="Adicional"
          value={filters.isAdditional}
          onChange={(e) =>
            setFilters({
              ...filters,
              isAdditional: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkCalendar;
