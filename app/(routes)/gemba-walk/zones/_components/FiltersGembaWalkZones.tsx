import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useUserSessionStore } from "@store";

import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
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
  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () => setFilters({ ...filters, manufacturingPlantId: "" }),
    },
    !!filters.nameZone && {
      key: "nameZone",
      label: "Zona",
      value: filters.nameZone,
      onRemove: () => setFilters({ ...filters, nameZone: "" }),
    },
    !!filters.nameLocation && {
      key: "nameLocation",
      label: "Ubicación",
      value: filters.nameLocation,
      onRemove: () => setFilters({ ...filters, nameLocation: "" }),
    },
  );

  return (
    <FilterBar count={count} activeFilters={activeFilters} onClearAll={onClear}>
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
        <Paper>
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
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
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
        </Paper>
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkZones;
