import { useMemo } from "react";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";

import { EMPTY_CATALOG, useIcsCatalogs } from "@hooks";
import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useUserSessionStore } from "@store";

export interface IFiltersIcs {
  // Busca por regla de vida o estándar de comportamiento.
  name: string;
  manufacturingPlantId: string;
  areaOfBehaviorId: string;
}

export const DEFAULT_FILTERS_ICS: IFiltersIcs = {
  name: "",
  manufacturingPlantId: "",
  areaOfBehaviorId: "",
};

interface Props {
  filters: IFiltersIcs;
  setFilters: (filters: IFiltersIcs) => void;
  count: number;
}

const FiltersIcs = ({ filters, setFilters, count }: Props) => {
  const catalogs = useIcsCatalogs().data ?? EMPTY_CATALOG;

  // Las áreas cuelgan de cada estándar; se aplanan sin repetir.
  const areasOfBehavior = useMemo(() => {
    const areas = new Map<number, { id: number; name: string }>();
    catalogs.forEach((rule) =>
      rule.standards?.forEach((standard) =>
        standard.areas?.forEach((area) =>
          areas.set(area.id, { id: area.id, name: area.name }),
        ),
      ),
    );
    return [...areas.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogs]);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () => setFilters({ ...filters, manufacturingPlantId: "" }),
    },
    !!filters.areaOfBehaviorId && {
      key: "areaOfBehaviorId",
      label: "Área",
      value: optionLabel(filters.areaOfBehaviorId, areasOfBehavior),
      onRemove: () => setFilters({ ...filters, areaOfBehaviorId: "" }),
    },
    !!filters.name && {
      key: "name",
      label: "Regla / Estándar",
      value: filters.name,
      onRemove: () => setFilters({ ...filters, name: "" }),
    },
  );

  return (
    <FilterBar
      count={count}
      activeFilters={activeFilters}
      onClearAll={() => setFilters(DEFAULT_FILTERS_ICS)}
    >
      <ClearFiltersButton
        visible={
          !!filters.name ||
          !!filters.manufacturingPlantId ||
          !!filters.areaOfBehaviorId
        }
        onClick={() => setFilters(DEFAULT_FILTERS_ICS)}
      />
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) =>
          setFilters({
            ...filters,
            manufacturingPlantId: e.target.value,
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
          data={areasOfBehavior}
          label="Área al que aplica"
          value={filters.areaOfBehaviorId}
          onChange={(e) =>
            setFilters({
              ...filters,
              areaOfBehaviorId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 4,
        }}
      >
        <Paper>
          <TextField
            fullWidth
            label="Regla de vida / Estándar de comportamiento"
            variant="outlined"
            value={filters.name}
            autoComplete="off"
            onChange={(e) =>
              setFilters({
                ...filters,
                name: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
    </FilterBar>
  );
};

export default FiltersIcs;
