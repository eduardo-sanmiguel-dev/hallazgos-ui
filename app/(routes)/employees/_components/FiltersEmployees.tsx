import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { TextField } from "@mui/material";
import { useEmployeeCatalogs } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useUserSessionStore } from "@store";

import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

// Filtros de EmployeesService.findAll (lo usan otras pantallas).
export interface IFiltersEmployees {
  manufacturingPlantId?: number;
  name?: string;
  positionId?: number;
  areaId?: number;
  isActive?: string;
}

// Filtros del listado de colaboradores (valores de los selects).
export interface IFiltersEmployeesList {
  // Nombre o número de colaborador.
  name: string;
  manufacturingPlantId: string;
  areaId: string;
  positionId: string;
  genreId: string;
  isActive: string;
}

export const DEFAULT_FILTERS_EMPLOYEES: IFiltersEmployeesList = {
  name: "",
  manufacturingPlantId: "",
  areaId: "",
  positionId: "",
  genreId: "",
  isActive: "true",
};

const STATUS_OPTIONS = [
  { id: "true", name: "Activos" },
  { id: "false", name: "Inactivos" },
];

interface Props {
  filters: IFiltersEmployeesList;
  setFilters: (filters: IFiltersEmployeesList) => void;
  count: number;
}

const FiltersEmployees = ({ filters, setFilters, count }: Props) => {
  const { data: catalogs } = useEmployeeCatalogs();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_EMPLOYEES) as (keyof IFiltersEmployeesList)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_EMPLOYEES[key]);

  const activeFilters = compactFilters(
    !!filters.name && {
      key: "name",
      label: "Nombre o código",
      value: filters.name,
      onRemove: () => setFilters({ ...filters, name: "" }),
    },
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () => setFilters({ ...filters, manufacturingPlantId: "" }),
    },
    !!filters.areaId && {
      key: "areaId",
      label: "Área",
      value: optionLabel(filters.areaId, catalogs?.areas ?? []),
      onRemove: () => setFilters({ ...filters, areaId: "" }),
    },
    !!filters.positionId && {
      key: "positionId",
      label: "Puesto",
      value: optionLabel(filters.positionId, catalogs?.positions ?? []),
      onRemove: () => setFilters({ ...filters, positionId: "" }),
    },
    !!filters.genreId && {
      key: "genreId",
      label: "Género",
      value: optionLabel(filters.genreId, catalogs?.genres ?? []),
      onRemove: () => setFilters({ ...filters, genreId: "" }),
    },
    {
      key: "isActive",
      label: "Estado",
      value: optionLabel(filters.isActive, STATUS_OPTIONS),
      // "Activos" es el valor por defecto: no hay nada que quitar.
      onRemove:
        filters.isActive === DEFAULT_FILTERS_EMPLOYEES.isActive
          ? undefined
          : () =>
              setFilters({
                ...filters,
                isActive: DEFAULT_FILTERS_EMPLOYEES.isActive,
              }),
    },
  );

  return (
    <FilterBar
      count={count}
      activeFilters={activeFilters}
      onClearAll={() => setFilters(DEFAULT_FILTERS_EMPLOYEES)}
    >
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_EMPLOYEES)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper>
          <TextField
            fullWidth
            label="Nombre o código"
            variant="outlined"
            value={filters.name}
            autoComplete="off"
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </Paper>
      </Grid>
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) =>
          setFilters({ ...filters, manufacturingPlantId: e.target.value })
        }
        isFilter={true}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={catalogs?.areas || []}
          label="Área"
          value={filters.areaId}
          onChange={(e) => setFilters({ ...filters, areaId: e.target.value })}
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={catalogs?.positions || []}
          label="Puesto"
          value={filters.positionId}
          onChange={(e) =>
            setFilters({ ...filters, positionId: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={catalogs?.genres || []}
          label="Género"
          value={filters.genreId}
          onChange={(e) => setFilters({ ...filters, genreId: e.target.value })}
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={STATUS_OPTIONS}
          label="Estado"
          value={filters.isActive}
          onChange={(e) =>
            setFilters({
              ...filters,
              // Sin selección vuelve a "Activos", como antes.
              isActive: e.target.value || "true",
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersEmployees;
