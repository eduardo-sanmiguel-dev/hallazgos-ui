import { useEffect, useMemo, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { CatalogICS } from "@interfaces";
import { IcsService } from "@services";

export interface IFiltersIcs {
  // Busca por regla de vida o estándar de comportamiento.
  name: string;
  manufacturingPlantId: string;
  areaOfBehaviorId: string;
}

export const DEFAULT_FILTERS_ICS: IFiltersIcs = {
  name: "",
  manufacturingPlantId: "",
  areaOfBehaviorId: "",
};

interface Props {
  filters: IFiltersIcs;
  setFilters: (filters: IFiltersIcs) => void;
  count: number;
}

const FiltersIcs = ({ filters, setFilters, count }: Props) => {
  const [catalogs, setCatalogs] = useState<CatalogICS[]>([]);

  useEffect(() => {
    IcsService.catalogs().then(setCatalogs);
  }, []);

  // Las áreas cuelgan de cada estándar; se aplanan sin repetir.
  const areasOfBehavior = useMemo(() => {
    const areas = new Map<number, { id: number; name: string }>();
    catalogs.forEach((rule) =>
      rule.standards?.forEach((standard) =>
        standard.areas?.forEach((area) =>
          areas.set(area.id, { id: area.id, name: area.name }),
        ),
      ),
    );
    return [...areas.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogs]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={
          !!filters.name ||
          !!filters.manufacturingPlantId ||
          !!filters.areaOfBehaviorId
        }
        onClick={() => setFilters(DEFAULT_FILTERS_ICS)}
      />
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
        <SelectDefault
          data={areasOfBehavior}
          label="Área al que aplica"
          value={filters.areaOfBehaviorId}
          onChange={(e) =>
            setFilters({
              ...filters,
              areaOfBehaviorId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 4,
        }}
      >
        <TextField
          fullWidth
          label="Regla de vida / Estándar de comportamiento"
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
    </FilterBar>
  );
};

export default FiltersIcs;
