import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { GembaWalkZonesService } from "@services";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersGembaWalkObservers {
  manufacturingPlantId: string;
  gembaWalkZoneId: string;
  userName: string;
}

interface Props {
  filters: IFiltersGembaWalkObservers;
  setFilters: (filters: IFiltersGembaWalkObservers) => void;
  count: number;
}

const FiltersGembaWalkObservers = ({ filters, setFilters, count }: Props) => {
  const [zones, setZones] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (!filters.manufacturingPlantId) {
      setZones([]);
      return;
    }

    GembaWalkZonesService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
    }).then((data) =>
      setZones(
        data.map((zone) => ({
          id: zone.id,
          name: `${zone.nameZone} - ${zone.nameLocation}`,
        })),
      ),
    );
  }, [filters.manufacturingPlantId]);

  return (
    <FilterBar count={count}>
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) =>
          setFilters({
            ...filters,
            manufacturingPlantId: e.target.value,
            gembaWalkZoneId: "",
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
          data={zones}
          label="Zona"
          value={filters.gembaWalkZoneId}
          onChange={(e) =>
            setFilters({
              ...filters,
              gembaWalkZoneId: e.target.value,
            })
          }
          isFilter={true}
          disabled={!filters.manufacturingPlantId}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <TextField
          fullWidth
          label="Usuario"
          variant="outlined"
          value={filters.userName}
          autoComplete="off"
          onChange={(e) =>
            setFilters({
              ...filters,
              userName: e.target.value,
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkObservers;
