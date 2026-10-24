import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";

import { EMPTY_CATALOG, useManufacturingPlants } from "@hooks";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";

import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersProcesses {
  name: string;
  manufacturingPlantId: string;
}

export const DEFAULT_FILTERS_PROCESSES: IFiltersProcesses = {
  name: "",
  manufacturingPlantId: "",
};

interface Props {
  filters: IFiltersProcesses;
  setFilters: (filters: IFiltersProcesses) => void;
  count: number;
}

const FiltersProcesses = ({ filters, setFilters, count }: Props) => {
  const manufacturingPlants = useManufacturingPlants().data ?? EMPTY_CATALOG;

  const activeFilters = compactFilters(
    !!filters.name && {
      key: "name",
      label: "Nombre",
      value: filters.name,
      onRemove: () => setFilters({ ...filters, name: "" }),
    },
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () => setFilters({ ...filters, manufacturingPlantId: "" }),
    },
  );

  return (
    <FilterBar
      count={count}
      activeFilters={activeFilters}
      onClearAll={() => setFilters(DEFAULT_FILTERS_PROCESSES)}
    >
      <ClearFiltersButton
        visible={!!filters.name || !!filters.manufacturingPlantId}
        onClick={() => setFilters(DEFAULT_FILTERS_PROCESSES)}
      />
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
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
        </Paper>
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
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersProcesses;
