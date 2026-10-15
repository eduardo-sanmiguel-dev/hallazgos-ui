import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersMainTypes {
  name: string;
}

interface Props {
  filters: IFiltersMainTypes;
  setFilters: (filters: IFiltersMainTypes) => void;
  count: number;
}

const FiltersMainTypes = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
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
      </Grid>
    </FilterBar>
  );
};

export default FiltersMainTypes;
