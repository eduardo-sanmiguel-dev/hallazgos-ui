import { Grid } from "@mui/material";
import { Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { TextField } from "@mui/material";
import { Paper } from "@mui/material";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

export interface IFiltersGembaWalkZones {
  nameZone: string;
  nameLocation: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersGembaWalkZones;
  setFilters: (filters: IFiltersGembaWalkZones) => void;
  count: number;
}

const FiltersGembaWalkZones = ({ filters, setFilters, count }: Props) => {
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
          <FilterListIcon
            sx={{
              pt: 1,
            }}
          />{" "}
          Filtros ({count})
        </Typography>
      </Grid>
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
    </Grid>
  );
};

export default FiltersGembaWalkZones;
