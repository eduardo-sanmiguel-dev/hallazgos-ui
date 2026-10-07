import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FilterListIcon from "@mui/icons-material/FilterList";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

export interface IFiltersExtinguisherInspections {
  search: string;
  manufacturingPlantId: string;
}

interface Props {
  filters: IFiltersExtinguisherInspections;
  setFilters: (filters: IFiltersExtinguisherInspections) => void;
  count: number;
}

const FiltersExtinguisherInspections = ({
  filters,
  setFilters,
  count,
}: Props) => {
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
            id="extinguisher-inspections-search"
            fullWidth
            label="ID o Responsable"
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

export default FiltersExtinguisherInspections;
