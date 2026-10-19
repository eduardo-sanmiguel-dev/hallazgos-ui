import { Grid } from "@mui/material";
import { TextField } from "@mui/material";

import { useEmployeeCatalogs } from "@hooks";
import SelectDefault from "@components/SelectDefault";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import FilterBar from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";

export interface IFiltersTrainingGuide {
  // Nombre o número de colaborador.
  name: string;
  manufacturingPlantId: string;
  areaId: string;
  positionId: string;
  // Estado de la guía del puesto actual: complete | pending | no-guide.
  signatureStatus: string;
}

export const DEFAULT_FILTERS_TRAINING_GUIDE: IFiltersTrainingGuide = {
  name: "",
  manufacturingPlantId: "",
  areaId: "",
  positionId: "",
  signatureStatus: "",
};

const SIGNATURE_STATUS_OPTIONS = [
  { id: "complete", name: "Firmas completas" },
  { id: "pending", name: "Firmas pendientes" },
  { id: "no-guide", name: "Sin guía" },
];

interface Props {
  filters: IFiltersTrainingGuide;
  setFilters: (filters: IFiltersTrainingGuide) => void;
  count: number;
}

const FiltersTrainingGuide = ({ filters, setFilters, count }: Props) => {
  const { data: catalogs } = useEmployeeCatalogs();

  const hasFiltersToClear = (
    Object.keys(
      DEFAULT_FILTERS_TRAINING_GUIDE,
    ) as (keyof IFiltersTrainingGuide)[]
  ).some((key) => filters[key] !== DEFAULT_FILTERS_TRAINING_GUIDE[key]);

  return (
    <FilterBar count={count}>
      <ClearFiltersButton
        visible={hasFiltersToClear}
        onClick={() => setFilters(DEFAULT_FILTERS_TRAINING_GUIDE)}
      />
      <SelectManufacturingPlantsOwn
        value={filters.manufacturingPlantId}
        onChange={(e) =>
          setFilters({ ...filters, manufacturingPlantId: e.target.value })
        }
        isFilter={true}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <TextField
          fullWidth
          label="Colaborador (nombre o número)"
          variant="outlined"
          value={filters.name}
          autoComplete="off"
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
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
          label="Puesto"
          value={filters.positionId}
          onChange={(e) =>
            setFilters({ ...filters, positionId: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={SIGNATURE_STATUS_OPTIONS}
          label="Estado de firmas"
          value={filters.signatureStatus}
          onChange={(e) =>
            setFilters({ ...filters, signatureStatus: e.target.value })
          }
          isFilter={true}
        />
      </Grid>
    </FilterBar>
  );
};

export default FiltersTrainingGuide;
