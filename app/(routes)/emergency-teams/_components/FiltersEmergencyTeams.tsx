import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FilterListIcon from "@mui/icons-material/FilterList";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

export interface IFiltersEmergencyTeams {
  search: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersEmergencyTeams;
  setFilters: (filters: IFiltersEmergencyTeams) => void;
  count: number;
}

const FiltersEmergencyTeams = ({ filters, setFilters, count }: Props) => {
  const theme = useTheme();

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
            id="emergency-teams-search"
            fullWidth
            label="Ubicación o N. Extintor"
            variant="outlined"
            value={filters.search}
            autoComplete="off"
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FiltersEmergencyTeams;
