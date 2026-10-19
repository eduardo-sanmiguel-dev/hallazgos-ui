import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersGembaWalkZones {
  nameZone: string;
  nameLocation: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersGembaWalkZones;
  setFilters: (filters: IFiltersGembaWalkZones) => void;
  count: number;
  // Visible cuando algún filtro difiere del valor por defecto.
  canClear?: boolean;
  onClear?: () => void;
}

const FiltersGembaWalkZones = ({
  filters,
  setFilters,
  count,
  canClear = false,
  onClear,
}: Props) => {
  return (
    <FilterBar count={count}>
      <ClearFiltersButton visible={canClear} onClick={() => onClear?.()} />
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
