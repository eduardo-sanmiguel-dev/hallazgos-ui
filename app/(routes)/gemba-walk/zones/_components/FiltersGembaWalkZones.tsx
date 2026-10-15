import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersGembaWalkZones {
  nameZone: string;
  nameLocation: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersGembaWalkZones;
  setFilters: (filters: IFiltersGembaWalkZones) => void;
  count: number;
}

const FiltersGembaWalkZones = ({ filters, setFilters, count }: Props) => {
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
          fullWidth
          label="Zona"
          variant="outlined"
          value={filters.nameZone}
          autoComplete="off"
          onChange={(e) =>
            setFilters({
              ...filters,
              nameZone: e.target.value,
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
        <TextField
          fullWidth
          label="Ubicación"
          variant="outlined"
          value={filters.nameLocation}
          autoComplete="off"
          onChange={(e) =>
            setFilters({
              ...filters,
              nameLocation: e.target.value,
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkZones;
