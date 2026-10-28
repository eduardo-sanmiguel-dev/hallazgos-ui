import { SelectChangeEvent } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { Grid } from "@mui/material";

import { useUserSessionStore } from "@store";
import SelectDefault from "./SelectDefault";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  isFilter?: boolean;
  // Error junto al campo (useFieldErrors lo encuentra para el foco).
  error?: string;
}

const SelectManufacturingPlantsOwn = ({
  value,
  onChange,
  isFilter = false,
  error,
}: Props) => {
  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants || [],
  );

  useEffect(() => {
    if (manufacturingPlants.length === 1 && !value) {
      onChange({
        target: {
          value: manufacturingPlants[0].id.toString(),
        },
      } as SelectChangeEvent<string>);
    }
  }, [manufacturingPlants, value, onChange]);

  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        md: 3,
      }}
    >
      <SelectDefault
        data={manufacturingPlants}
        label="Planta"
        value={value}
        onChange={onChange}
        isFilter={isFilter}
      />
      {error && (
        <FormHelperText data-error-for="manufacturingPlantId" error>
          {error}
        </FormHelperText>
      )}
    </Grid>
  );
};

export default SelectManufacturingPlantsOwn;
