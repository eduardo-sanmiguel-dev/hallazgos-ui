import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import dayjs from "dayjs";

import { useEmployeeCatalogs } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import DateFieldDMY from "@routes/gemba-walk/calendar/_components/DateFieldDMY";
import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { Equipment } from "@interfaces";
import { EquipmentsService } from "@services";

export interface IFiltersEpp {
  // Nombre o cédula del colaborador (área y cargo tienen su propio select).
  search: string;
  areaId: string;
  positionId: string;
  equipmentId: string;
  // Rango de fecha de entrega, YYYY-MM-DD o "".
  startDate: string;
  endDate: string;
}

export const DEFAULT_FILTERS_EPP: IFiltersEpp = {
  search: "",
  areaId: "",
  positionId: "",
  equipmentId: "",
  startDate: "",
  endDate: "",
};

interface Props {
  manufacturingPlantId: string;
  onManufacturingPlantChange: (manufacturingPlantId: string) => void;
  manufacturingPlants: { id: number; name: string }[];
  filters: IFiltersEpp;
  setFilters: (filters: IFiltersEpp) => void;
  count: number;
}

const FiltersEpp = ({
  manufacturingPlantId,
  onManufacturingPlantChange,
  manufacturingPlants,
  filters,
  setFilters,
  count,
}: Props) => {
  const { data: catalogs } = useEmployeeCatalogs();
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  // Los equipos dependen de la planta.
  useEffect(() => {
    if (!manufacturingPlantId) {
      setEquipments([]);
      return;
    }

    EquipmentsService.findAll({ manufacturingPlantId }).then(setEquipments);
  }, [manufacturingPlantId]);

  const hasFiltersToClear = (
    Object.keys(DEFAULT_FILTERS_EPP) as (keyof IFiltersEpp)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_EPP[key]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_EPP)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={manufacturingPlants}
          label="Planta"
          value={manufacturingPlantId}
          onChange={(e) => onManufacturingPlantChange(e.target.value)}
          validationEmpty
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Colaborador (nombre o cédula)"
          variant="outlined"
          value={filters.search}
          autoComplete="off"
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={catalogs?.areas || []}
          label="Área"
          value={filters.areaId}
          onChange={(e) => setFilters({ ...filters, areaId: e.target.value })}
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={catalogs?.positions || []}
          label="Cargo"
          value={filters.positionId}
          onChange={(e) =>
            setFilters({ ...filters, positionId: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={equipments}
          label="Equipo entregado"
          value={filters.equipmentId}
          onChange={(e) =>
            setFilters({ ...filters, equipmentId: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <DateFieldDMY
          label="Entrega desde"
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
          label="Entrega hasta"
          value={filters.endDate}
          minDate={filters.startDate ? dayjs(filters.startDate) : undefined}
          onChange={(endDate) => setFilters({ ...filters, endDate })}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersEpp;
