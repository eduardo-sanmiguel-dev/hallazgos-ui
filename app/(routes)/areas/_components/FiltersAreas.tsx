import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersAreas {
  name: string;
  manufacturingPlantId: string;
}

export const DEFAULT_FILTERS_AREAS: IFiltersAreas = {
  name: "",
  manufacturingPlantId: "",
};

interface Props {
  filters: IFiltersAreas;
  setFilters: (filters: IFiltersAreas) => void;
  count: number;
}

const FiltersAreas = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={!!filters.name || !!filters.manufacturingPlantId}
        onClick={() => setFilters(DEFAULT_FILTERS_AREAS)}
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
    </FilterBar>
  );
};

export default FiltersAreas;
