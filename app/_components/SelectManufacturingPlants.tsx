import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";

import { useManufacturingPlants } from "@hooks";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  isFilter?: boolean;
}

const SelectManufacturingPlants = ({
  value,
  onChange,
  isFilter = false,
}: Props) => {
  const { data: manufacturingPlants = [] } = useManufacturingPlants();

  return (
    <FormControl fullWidth>
      <InputLabel id="manufacturing-plant-simple-select-label">
        Planta
      </InputLabel>
      <Select
        labelId="manufacturing-plant-simple-select-label"
        id="manufacturing-plant-simple-select"
        label="Planta"
        value={value}
        onChange={onChange}
      >
        {isFilter && <MenuItem value="">Ninguna</MenuItem>}
        {manufacturingPlants.map((manufacturingPlant) => (
          <MenuItem
            key={manufacturingPlant.id}
            value={String(manufacturingPlant.id)}
          >
            {manufacturingPlant.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectManufacturingPlants;
