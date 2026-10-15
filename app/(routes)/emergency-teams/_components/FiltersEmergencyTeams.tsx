import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersEmergencyTeams {
  search: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersEmergencyTeams;
  setFilters: (filters: IFiltersEmergencyTeams) => void;
  count: number;
}

const FiltersEmergencyTeams = ({ filters, setFilters, count }: Props) => {
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
          id="emergency-teams-search"
          fullWidth
          label="Ubicación o N. Extintor"
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

export default FiltersEmergencyTeams;
