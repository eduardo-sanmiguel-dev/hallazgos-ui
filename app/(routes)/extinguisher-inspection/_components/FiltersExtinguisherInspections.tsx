import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersExtinguisherInspections {
  search: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersExtinguisherInspections;
  setFilters: (filters: IFiltersExtinguisherInspections) => void;
  count: number;
}

const FiltersExtinguisherInspections = ({
  filters,
  setFilters,
  count,
}: Props) => {
  return (
    <FilterBar count={count}>

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
        <TextField
          id="extinguisher-inspections-search"
          fullWidth
          label="ID o Responsable"
          variant="outlined"
          value={filters.search}
          autoComplete="off"
          onChange={(e) =>
            setFilters({
              ...filters,
              search: e.target.value,
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersExtinguisherInspections;
