import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersManufacturingPlants {
  name: string;
}

export const DEFAULT_FILTERS_MANUFACTURING_PLANTS: IFiltersManufacturingPlants =
  { name: "" };

interface Props {
  filters: IFiltersManufacturingPlants;
  setFilters: (filters: IFiltersManufacturingPlants) => void;
  count: number;
}

const FiltersManufacturingPlants = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar
      count={count}
      activeFilters={
        filters.name
          ? [
              {
                key: "name",
                label: "Nombre",
                value: filters.name,
                onRemove: () => setFilters({ ...filters, name: "" }),
              },
            ]
          : []
      }
      onClearAll={() => setFilters(DEFAULT_FILTERS_MANUFACTURING_PLANTS)}
    >
      <ClearFiltersButton
        visible={!!filters.name}
        onClick={() => setFilters(DEFAULT_FILTERS_MANUFACTURING_PLANTS)}
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
