import { SelectChangeEvent } from "@mui/material";
import { Grid } from "@mui/material";

import { useUserSessionStore } from "@store";
import SelectDefault from "./SelectDefault";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  isFilter?: boolean;
}

const SelectManufacturingPlantsOwn = ({
  value,
  onChange,
  isFilter = false,
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
    </Grid>
  );
};

export default SelectManufacturingPlantsOwn;
