import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import { EMPTY_CATALOG, useProcesses } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectRules from "@components/SelectRules";
import SelectZones from "@components/SelectZones";
import FilterBar from "@shared/components/FilterBar";
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

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_USERS) as (keyof IFiltersUsers)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_USERS[key]);

  return (
    <FilterBar count={count}>
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
