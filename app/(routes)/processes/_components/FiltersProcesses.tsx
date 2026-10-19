import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectManufacturingPlants from "@components/SelectManufacturingPlants";

import FilterBar from "@shared/components/FilterBar";
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
  return (
    <FilterBar count={count}>
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
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersProcesses;
