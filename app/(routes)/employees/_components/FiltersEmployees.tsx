import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { useEmployeeCatalogs } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

import FilterBar from "@shared/components/FilterBar";
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

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_EMPLOYEES) as (keyof IFiltersEmployeesList)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_EMPLOYEES[key]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_EMPLOYEES)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Nombre o código"
          variant="outlined"
          value={filters.name}
          autoComplete="off"
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
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
