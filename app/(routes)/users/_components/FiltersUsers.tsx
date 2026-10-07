import { Grid } from "@mui/material";
import { Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField } from "@mui/material";
import { Paper } from "@mui/material";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectRules from "@components/SelectRules";
import SelectZones from "@components/SelectZones";
// import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
// import SelectRules from "@components/SelectRules";
// import SelectZones from "@components/SelectZones";

export interface IFiltersUsers {
  name: string;
  manufacturingPlantId: string;
  rule: string;
  zoneId: string;
}

interface Props {
  filters: IFiltersUsers;
  setFilters: (filters: IFiltersUsers) => void;
  count: number;
}

const FiltersUsers = ({ filters, setFilters, count }: Props) => {
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
          sx={{
            color: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.common.black
                : theme.palette.common.white,
          }}
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
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
        }}
      >
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
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 2,
        }}
      >
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
      </Grid>
    </Grid>
  );
};

export default FiltersUsers;
