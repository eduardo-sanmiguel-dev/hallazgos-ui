import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import DateFieldDMY from "@routes/gemba-walk/calendar/_components/DateFieldDMY";

import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersExtinguisherInspections {
  search: string;
  manufacturingPlantId: string;
  // Rango de fecha de inspección, YYYY-MM-DD o "".
  startDate: string;
  endDate: string;
}

export const DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS: IFiltersExtinguisherInspections =
  {
    search: "",
    manufacturingPlantId: "",
    startDate: "",
    endDate: "",
  };

interface Props {
  filters: IFiltersExtinguisherInspections;
  setFilters: (filters: IFiltersExtinguisherInspections) => void;
  count: number;
}

const FiltersExtinguisherInspections = ({
  filters,
  setFilters,
  count,
}: Props) => {
  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={
          !!filters.search ||
          !!filters.manufacturingPlantId ||
          !!filters.startDate ||
          !!filters.endDate
        }
        onClick={() => setFilters(DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS)}
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
        <TextField
          id="extinguisher-inspections-search"
          fullWidth
          label="ID o Responsable"
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

      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <DateFieldDMY
          label="Inspección desde"
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

      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <DateFieldDMY
          label="Inspección hasta"
          value={filters.endDate}
          minDate={filters.startDate ? dayjs(filters.startDate) : undefined}
          onChange={(endDate) =>
            setFilters({
              ...filters,
              endDate,
            })
          }
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersExtinguisherInspections;
