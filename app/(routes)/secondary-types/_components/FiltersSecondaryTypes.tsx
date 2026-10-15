import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectMainTypes from "@components/SelectMainTypes";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersSecondaryTypes {
  name: string;
  mainTypeId: string;
}

interface Props {
  filters: IFiltersSecondaryTypes;
  setFilters: (filters: IFiltersSecondaryTypes) => void;
  count: number;
}

const FiltersSecondaryTypes = ({ filters, setFilters, count }: Props) => {
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
          onChange={(e) =>
            setFilters({
              ...filters,
              name: e.target.value,
            })
          }
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectMainTypes
          value={filters.mainTypeId}
          onChange={(e) =>
            setFilters({
              ...filters,
              mainTypeId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersSecondaryTypes;
