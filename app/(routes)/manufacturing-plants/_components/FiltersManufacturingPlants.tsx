import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersManufacturingPlants {
  name: string;
}

interface Props {
  filters: IFiltersManufacturingPlants;
  setFilters: (filters: IFiltersManufacturingPlants) => void;
  count: number;
}

const FiltersManufacturingPlants = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
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
          onChange={(e) => {
            setFilters({
              ...filters,
              name: e.target.value,
            });
          }}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersManufacturingPlants;
