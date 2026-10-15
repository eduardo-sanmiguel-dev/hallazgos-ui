import { useEffect, useMemo, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import SelectDefault from "@components/SelectDefault";
import { EmployeesService } from "@services";
import { CatalogEmployee } from "@interfaces";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersEmployees {
  manufacturingPlantId?: number;
  name?: string;
  positionId?: number;
  areaId?: number;
  assignedUserId?: number;
  isActive?: string;
}

const STATUS_OPTIONS = [
  { id: "true", name: "Activos" },
  { id: "false", name: "Inactivos" },
];

interface Props {
  filters: IFiltersEmployees;
  setFilters: (filters: IFiltersEmployees) => void;
  count: number;
}

const FiltersEmployees = ({ filters, setFilters, count }: Props) => {
  const [catalogs, setCatalogs] = useState<CatalogEmployee | null>(null);

  useEffect(() => {
    EmployeesService.catalogs().then(setCatalogs);
  }, []);

  const areaOptions = useMemo(
    () =>
      (catalogs?.areas || []).map((item) => ({
        id: String(item.id),
        name: item.name,
      })),
    [catalogs],
  );

  const positionOptions = useMemo(
    () =>
      (catalogs?.positions || []).map((item) => ({
        id: String(item.id),
        name: item.name,
      })),
    [catalogs],
  );

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
          label="Nombre o código"
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
        <SelectDefault
          data={areaOptions}
          label="Área"
          value={filters.areaId ? String(filters.areaId) : ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              areaId: e.target.value ? Number(e.target.value) : undefined,
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
        <SelectDefault
          data={positionOptions}
          label="Puesto"
          value={filters.positionId ? String(filters.positionId) : ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              positionId: e.target.value ? Number(e.target.value) : undefined,
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
        <SelectDefault
          data={STATUS_OPTIONS}
          label="Estado"
          value={filters.isActive || "true"}
          onChange={(e) =>
            setFilters({
              ...filters,
              isActive: e.target.value,
            })
          }
          isFilter={true}
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

export default FiltersEmployees;
