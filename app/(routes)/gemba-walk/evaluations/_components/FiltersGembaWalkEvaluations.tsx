import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { GEMBA_WALK_EVALUATION_CATEGORIES } from "@interfaces";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersGembaWalkEvaluations {
  manufacturingPlantId: string;
  category: string;
  search: string;
}

interface Props {
  filters: IFiltersGembaWalkEvaluations;
  setFilters: (filters: IFiltersGembaWalkEvaluations) => void;
  count: number;
}

// SelectDefault usa el id como valor; aquí el id es el nombre de la categoría.
export const categoryOptions = GEMBA_WALK_EVALUATION_CATEGORIES.map(
  (category) => ({ id: category, name: category }),
);

const FiltersGembaWalkEvaluations = ({ filters, setFilters, count }: Props) => {
  return (
    <FilterBar count={count}>
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
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={categoryOptions}
          label="Categoría"
          value={filters.category}
          onChange={(e) =>
            setFilters({
              ...filters,
              category: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Área o descripción"
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
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkEvaluations;
