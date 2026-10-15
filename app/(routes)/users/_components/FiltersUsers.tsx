import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectRules from "@components/SelectRules";
import SelectZones from "@components/SelectZones";

import FilterBar from "@shared/components/FilterBar";
// import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
// import SelectRules from "@components/SelectRules";
// import SelectZones from "@components/SelectZones";

export interface IFiltersUsers {
  name: string;
  manufacturingPlantId: string;
  rule: string;
  zoneId: string;
}

interface Props {
  filters: IFiltersUsers;
  setFilters: (filters: IFiltersUsers) => void;
  count: number;
}

const FiltersUsers = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
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
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
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
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
        }}
      >
        <SelectRules
          value={filters.rule}
          onChange={(e) =>
            setFilters({
              ...filters,
              rule: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
        }}
      >
        <SelectZones
          value={filters.zoneId}
          onChange={(e) =>
            setFilters({
              ...filters,
              zoneId: e.target.value,
            })
          }
          isFilter={true}
          manufacturingPlantId={filters.manufacturingPlantId}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersUsers;
