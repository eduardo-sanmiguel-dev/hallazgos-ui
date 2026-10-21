import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import {
  EMPTY_CATALOG,
  useManufacturingPlants,
  useProcesses,
  useZones,
} from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectRules from "@components/SelectRules";
import SelectZones from "@components/SelectZones";
import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersUsers {
  // Nombre o correo electrónico.
  search: string;
  manufacturingPlantId: string;
  rule: string;
  // Filtrar por zona muestra solo supervisores (la API lo aplica).
  zoneId: string;
  processId: string;
}

export const DEFAULT_FILTERS_USERS: IFiltersUsers = {
  search: "",
  manufacturingPlantId: "",
  rule: "",
  zoneId: "",
  processId: "",
};

interface Props {
  filters: IFiltersUsers;
  setFilters: (filters: IFiltersUsers) => void;
  count: number;
}

const FiltersUsers = ({ filters, setFilters, count }: Props) => {
  // Zonas y procesos dependen de la planta.
  const processes =
    useProcesses(
      { manufacturingPlantId: filters.manufacturingPlantId },
      { enabled: !!filters.manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;

  const manufacturingPlants = useManufacturingPlants().data ?? EMPTY_CATALOG;
  const zones =
    useZones(
      { manufacturingPlantId: filters.manufacturingPlantId },
      { enabled: !!filters.manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_USERS) as (keyof IFiltersUsers)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_USERS[key]);

  const activeFilters = compactFilters(
    !!filters.search && {
      key: "search",
      label: "Nombre o correo",
      value: filters.search,
      onRemove: () => setFilters({ ...filters, search: "" }),
    },
    !!filters.rule && {
      key: "rule",
      label: "Rol",
      value: filters.rule,
      onRemove: () => setFilters({ ...filters, rule: "" }),
    },
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () =>
        setFilters({
          ...filters,
          manufacturingPlantId: "",
          zoneId: "",
          processId: "",
        }),
    },
    !!filters.zoneId && {
      key: "zoneId",
      label: "Zona",
      value: optionLabel(filters.zoneId, zones),
      onRemove: () => setFilters({ ...filters, zoneId: "" }),
    },
    !!filters.processId && {
      key: "processId",
      label: "Proceso",
      value: optionLabel(filters.processId, processes),
      onRemove: () => setFilters({ ...filters, processId: "" }),
    },
  );

  return (
    <FilterBar
      count={count}
      activeFilters={activeFilters}
      onClearAll={() => setFilters(DEFAULT_FILTERS_USERS)}
    >
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_USERS)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Nombre o correo"
          variant="outlined"
          value={filters.search}
          autoComplete="off"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SelectRules
          value={filters.rule}
          onChange={(e) => setFilters({ ...filters, rule: e.target.value })}
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectManufacturingPlants
          value={filters.manufacturingPlantId}
          onChange={(e) =>
            setFilters({
              ...filters,
              manufacturingPlantId: e.target.value,
              zoneId: "",
              processId: "",
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SelectZones
          value={filters.zoneId}
          onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
          isFilter={true}
          manufacturingPlantId={filters.manufacturingPlantId}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SelectDefault
          data={processes}
          label="Proceso"
          value={filters.processId}
          onChange={(e) =>
            setFilters({ ...filters, processId: e.target.value })
          }
          isFilter={true}
          disabled={!filters.manufacturingPlantId}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersUsers;
