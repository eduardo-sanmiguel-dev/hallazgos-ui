import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectMainTypes from "@components/SelectMainTypes";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersSecondaryTypes {
  name: string;
  mainTypeId: string;
}

interface Props {
  filters: IFiltersSecondaryTypes;
  setFilters: (filters: IFiltersSecondaryTypes) => void;
  count: number;
  // Visible cuando algún filtro difiere del valor por defecto.
  canClear?: boolean;
  onClear?: () => void;
}

const FiltersSecondaryTypes = ({
  filters,
  setFilters,
  count,
  canClear = false,
  onClear,
}: Props) => {
  return (
    <FilterBar count={count}>
      <ClearFiltersButton visible={canClear} onClick={() => onClear?.()} />
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
