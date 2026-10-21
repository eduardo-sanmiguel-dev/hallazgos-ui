import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import dayjs from "dayjs";

import { EMPTY_CATALOG, useTypesOfEvents, useZones } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import DateFieldDMY from "@routes/gemba-walk/calendar/_components/DateFieldDMY";
import { useUserSessionStore } from "@store";
import FilterBar, {
  compactFilters,
  formatDateDMY,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

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
  const typesOfEvents = useTypesOfEvents().data ?? EMPTY_CATALOG;
  // Las zonas dependen de la planta elegida.
  const zones =
    useZones(
      { manufacturingPlantId: filters.manufacturingPlantId },
      { enabled: !!filters.manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_CIAELS) as (keyof IFiltersCiaels)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_CIAELS[key]);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const activeFilters = compactFilters(
    !!filters.manufacturingPlantId && {
      key: "manufacturingPlantId",
      label: "Planta",
      value: optionLabel(filters.manufacturingPlantId, manufacturingPlants),
      onRemove: () =>
        setFilters({ ...filters, manufacturingPlantId: "", zoneId: "" }),
    },
    !!filters.zoneId && {
      key: "zoneId",
      label: "Zona",
      value: optionLabel(filters.zoneId, zones),
      onRemove: () => setFilters({ ...filters, zoneId: "" }),
    },
    !!filters.typeOfEventId && {
      key: "typeOfEventId",
      label: "Tipo de evento",
      value: optionLabel(filters.typeOfEventId, typesOfEvents),
      onRemove: () => setFilters({ ...filters, typeOfEventId: "" }),
    },
    !!filters.employee && {
      key: "employee",
      label: "Colaborador",
      value: filters.employee,
      onRemove: () => setFilters({ ...filters, employee: "" }),
    },
    !!filters.startDate && {
      key: "startDate",
      label: "Desde",
      value: formatDateDMY(filters.startDate),
      onRemove: () => setFilters({ ...filters, startDate: "" }),
    },
    !!filters.endDate && {
      key: "endDate",
      label: "Hasta",
      value: formatDateDMY(filters.endDate),
      onRemove: () => setFilters({ ...filters, endDate: "" }),
    },
  );

  return (
    <FilterBar
      count={count}
      activeFilters={activeFilters}
      onClearAll={() => setFilters(DEFAULT_FILTERS_CIAELS)}
    >
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
