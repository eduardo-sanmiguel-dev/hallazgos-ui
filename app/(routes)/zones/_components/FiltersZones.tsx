import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { AreasService } from "@services";
import { Area } from "@interfaces";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersZones {
  name: string;
  manufacturingPlantId: string;
  areaId: string;
}

interface Props {
  filters: IFiltersZones;
  setFilters: (filters: IFiltersZones) => void;
  count: number;
}

const FiltersZones = ({ filters, setFilters, count }: Props) => {
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    AreasService.findAll({}).then((data) => {
      const orderedAreas = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      );

      setAreas(orderedAreas);
    });
  }, []);

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
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <SelectDefault
          data={areas}
          label="Zona"
          value={filters.areaId}
          onChange={(e) =>
            setFilters({
              ...filters,
              areaId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersZones;
