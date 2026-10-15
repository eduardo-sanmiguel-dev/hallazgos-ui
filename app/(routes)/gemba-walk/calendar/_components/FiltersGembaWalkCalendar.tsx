import { useEffect, useState } from "react";

import { Grid } from "@mui/material";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { GembaWalkZonesService } from "@services";
import DateFieldDMY from "./DateFieldDMY";

import FilterBar from "@shared/components/FilterBar";

export interface IFiltersGembaWalkCalendar {
  manufacturingPlantId: string;
  gembaWalkZoneId: string;
  // YYYY-MM-DD (días locales, ambos inclusivos)
  startDate: string;
  endDate: string;
}

interface Props {
  filters: IFiltersGembaWalkCalendar;
  setFilters: (filters: IFiltersGembaWalkCalendar) => void;
  count: number;
}

const FiltersGembaWalkCalendar = ({ filters, setFilters, count }: Props) => {
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
        <DateFieldDMY
          label="Desde"
          value={filters.startDate}
          onChange={(value) =>
            setFilters({
              ...filters,
              startDate: value,
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
        <DateFieldDMY
          label="Hasta"
          value={filters.endDate}
          onChange={(value) =>
            setFilters({
              ...filters,
              endDate: value,
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersGembaWalkCalendar;
