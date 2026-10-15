import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersIcs {
  manufacturingPlantId?: number;
  name?: string;
}

interface Props {
  filters: IFiltersIcs;
  setFilters: (filters: IFiltersIcs) => void;
  count: number;
}

const FiltersIcs = ({ filters, setFilters, count }: Props) => {
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
      {/*<Grid item xs={12} sm={4} md={2}>
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
      <Grid item xs={12} sm={4} md={2}>
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
      <Grid item xs={12} sm={4} md={2}>
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
          </Grid>*/}
    </FilterBar>
  );
};

export default FiltersIcs;
