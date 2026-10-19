import { useMemo } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import { useAreas } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersZones {
  name: string;
  manufacturingPlantId: string;
  areaId: string;
}

export const DEFAULT_FILTERS_ZONES: IFiltersZones = {
  name: "",
  manufacturingPlantId: "",
  areaId: "",
};

interface Props {
  filters: IFiltersZones;
  setFilters: (filters: IFiltersZones) => void;
  count: number;
}

const FiltersZones = ({ filters, setFilters, count }: Props) => {
  // Las zonas (areas) se acotan a la planta elegida.
  const { data: areasData } = useAreas({
    manufacturingPlantId: filters.manufacturingPlantId,
  });

  const areas = useMemo(
    () =>
      [...(areasData ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      ),
    [areasData],
  );

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_ZONES) as (keyof IFiltersZones)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_ZONES[key]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_ZONES)}
      />
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <TextField
          fullWidth
          label="Nombre"
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
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectManufacturingPlants
          value={filters.manufacturingPlantId}
          onChange={(e) =>
            setFilters({
              ...filters,
              manufacturingPlantId: e.target.value,
              areaId: "",
            })
          }
          isFilter={true}
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
          data={areas}
          label="Zona"
          value={filters.areaId}
          onChange={(e) =>
            setFilters({
              ...filters,
              areaId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersZones;
