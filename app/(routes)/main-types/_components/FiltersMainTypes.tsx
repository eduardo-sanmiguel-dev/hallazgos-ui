import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersMainTypes {
  name: string;
}

interface Props {
  filters: IFiltersMainTypes;
  setFilters: (filters: IFiltersMainTypes) => void;
  count: number;
  // Visible cuando algún filtro difiere del valor por defecto.
  canClear?: boolean;
  onClear?: () => void;
}

const FiltersMainTypes = ({
  filters,
  setFilters,
  count,
  canClear = false,
  onClear,
}: Props) => {
  return (
    <FilterBar
      count={count}
      activeFilters={
        filters.name
          ? [
              {
                key: "name",
                label: "Nombre",
                value: filters.name,
                onRemove: () => setFilters({ ...filters, name: "" }),
              },
            ]
          : []
      }
      onClearAll={onClear}
    >
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
