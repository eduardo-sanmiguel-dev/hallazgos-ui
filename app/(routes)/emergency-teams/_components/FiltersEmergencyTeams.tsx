import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { ExtinguisherType } from "@interfaces";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersEmergencyTeams {
  search: string;
  manufacturingPlantId: string;
  typeOfExtinguisher: string;
}

export const DEFAULT_FILTERS_EMERGENCY_TEAMS: IFiltersEmergencyTeams = {
  search: "",
  manufacturingPlantId: "",
  typeOfExtinguisher: "",
};

const EXTINGUISHER_TYPE_OPTIONS = Object.values(ExtinguisherType).map(
  (type) => ({ id: type, name: type }),
);

interface Props {
  filters: IFiltersEmergencyTeams;
  setFilters: (filters: IFiltersEmergencyTeams) => void;
  count: number;
}

const FiltersEmergencyTeams = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={Object.values(filters).some(Boolean)}
        onClick={() => setFilters(DEFAULT_FILTERS_EMERGENCY_TEAMS)}
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
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectDefault
          data={EXTINGUISHER_TYPE_OPTIONS}
          label="Tipo de extintor"
          value={filters.typeOfExtinguisher}
          onChange={(e) =>
            setFilters({
              ...filters,
              typeOfExtinguisher: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersEmergencyTeams;
