import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import dayjs from "dayjs";

import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import DateFieldDMY from "@routes/gemba-walk/calendar/_components/DateFieldDMY";
import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { TypeOfEvent, Zone } from "@interfaces";
import { TypesOfEventsService, ZonesService } from "@services";

export interface IFiltersCiaels {
  manufacturingPlantId: string;
  typeOfEventId: string;
  zoneId: string;
  // Nombre o número de colaborador.
  employee: string;
  // Rango de fecha de evento, YYYY-MM-DD o "".
  startDate: string;
  endDate: string;
}

export const DEFAULT_FILTERS_CIAELS: IFiltersCiaels = {
  manufacturingPlantId: "",
  typeOfEventId: "",
  zoneId: "",
  employee: "",
  startDate: "",
  endDate: "",
};

interface Props {
  filters: IFiltersCiaels;
  setFilters: (filters: IFiltersCiaels) => void;
  count: number;
}

const FiltersCiaels = ({ filters, setFilters, count }: Props) => {
  const [typesOfEvents, setTypesOfEvents] = useState<TypeOfEvent[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    TypesOfEventsService.findAll().then(setTypesOfEvents);
  }, []);

  // Las zonas dependen de la planta elegida.
  useEffect(() => {
    if (!filters.manufacturingPlantId) {
      setZones([]);
      return;
    }

    ZonesService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
    }).then(setZones);
  }, [filters.manufacturingPlantId]);

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_CIAELS) as (keyof IFiltersCiaels)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_CIAELS[key]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_CIAELS)}
      />
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) => {
          if (e.target.value === filters.manufacturingPlantId) return;
          setFilters({
            ...filters,
            manufacturingPlantId: e.target.value,
            zoneId: "",
          });
        }}
        isFilter={true}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={zones}
          label="Zona"
          value={filters.zoneId}
          onChange={(e) => setFilters({ ...filters, zoneId: e.target.value })}
          isFilter={true}
          disabled={!filters.manufacturingPlantId}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={typesOfEvents}
          label="Tipo de evento"
          value={filters.typeOfEventId}
          onChange={(e) =>
            setFilters({ ...filters, typeOfEventId: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Colaborador (nombre o número)"
          variant="outlined"
          value={filters.employee}
          autoComplete="off"
          onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <DateFieldDMY
          label="Evento desde"
          value={filters.startDate}
          onChange={(startDate) =>
            setFilters({
              ...filters,
              startDate,
              // Evita un rango invertido.
              ...(filters.endDate &&
                startDate > filters.endDate && { endDate: "" }),
            })
          }
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <DateFieldDMY
          label="Evento hasta"
          value={filters.endDate}
          minDate={filters.startDate ? dayjs(filters.startDate) : undefined}
          onChange={(endDate) => setFilters({ ...filters, endDate })}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersCiaels;
