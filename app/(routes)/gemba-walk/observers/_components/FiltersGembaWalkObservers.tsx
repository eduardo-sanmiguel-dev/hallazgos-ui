import { useMemo } from "react";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";

import { useGembaWalkZones } from "@hooks";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";

import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersGembaWalkObservers {
  manufacturingPlantId: string;
  gembaWalkZoneId: string;
  userName: string;
}

interface Props {
  filters: IFiltersGembaWalkObservers;
  setFilters: (filters: IFiltersGembaWalkObservers) => void;
  count: number;
  // Visible cuando algún filtro difiere del valor por defecto.
  canClear?: boolean;
  onClear?: () => void;
}

const FiltersGembaWalkObservers = ({
  filters,
  setFilters,
  count,
  canClear = false,
  onClear,
}: Props) => {
  const { data: gembaZones } = useGembaWalkZones(
    { manufacturingPlantId: filters.manufacturingPlantId },
    { enabled: !!filters.manufacturingPlantId },
  );

  const zones = useMemo(
    () =>
      (gembaZones ?? []).map((zone) => ({
        id: zone.id,
        name: `${zone.nameZone} - ${zone.nameLocation}`,
      })),
    [gembaZones],
  );

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () =>
        setFilters({
          ...filters,
          manufacturingPlantId: "",
          gembaWalkZoneId: "",
        }),
    },
    !!filters.gembaWalkZoneId && {
      key: "gembaWalkZoneId",
      label: "Zona",
      value: optionLabel(filters.gembaWalkZoneId, zones),
      onRemove: () => setFilters({ ...filters, gembaWalkZoneId: "" }),
    },
    !!filters.userName && {
      key: "userName",
      label: "Usuario",
      value: filters.userName,
      onRemove: () => setFilters({ ...filters, userName: "" }),
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
            gembaWalkZoneId: "",
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
        <SelectDefault
          data={zones}
          label="Zona"
          value={filters.gembaWalkZoneId}
          onChange={(e) =>
            setFilters({
              ...filters,
              gembaWalkZoneId: e.target.value,
            })
          }
          isFilter={true}
          disabled={!filters.manufacturingPlantId}
        />
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
            label="Usuario"
            variant="outlined"
            value={filters.userName}
            autoComplete="off"
            onChange={(e) =>
              setFilters({
                ...filters,
                userName: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkObservers;
