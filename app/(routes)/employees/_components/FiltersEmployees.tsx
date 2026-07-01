import { useEffect, useMemo, useState } from "react";

import { Grid } from "@mui/material";
import { Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField } from "@mui/material";
import { Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SelectDefault from "@components/SelectDefault";
import { EmployeesService } from "@services";
import { CatalogEmployee } from "@interfaces";

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
  const theme = useTheme();
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
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Typography
          variant="subtitle1"
          gutterBottom
          color={
            theme.palette.mode === "light"
              ? theme.palette.common.black
              : theme.palette.common.white
          }
        >
          <FilterListIcon sx={{ pt: 1 }} /> Filtros ({count})
        </Typography>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
        }}
      >
        <Paper>
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
        </Paper>
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
        <Paper>
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
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <Paper>
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
        </Paper>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <Paper>
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
        </Paper>
          </Grid>*/}
    </Grid>
  );
};

export default FiltersEmployees;
