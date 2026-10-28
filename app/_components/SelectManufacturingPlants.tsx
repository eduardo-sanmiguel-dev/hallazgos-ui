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
  // Al editar, el valor del registro llega antes que el catálogo: sin su
  // opción, MUI avisa "out-of-range value" en la consola. Se ve igual (vacío)
  // y el valor del formulario no cambia.
  const shownValue = manufacturingPlants.some(
    (manufacturingPlant) => String(manufacturingPlant.id) === value,
  )
    ? value
    : "";

  return (
    <FormControl fullWidth>
      <InputLabel id="manufacturing-plant-simple-select-label">
        Planta
      </InputLabel>
      <Select
        labelId="manufacturing-plant-simple-select-label"
        id="manufacturing-plant-simple-select"
        label="Planta"
        value={shownValue}
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
