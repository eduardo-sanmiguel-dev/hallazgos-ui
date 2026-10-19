import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";

import { useMainTypes } from "@hooks";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  isFilter?: boolean;
}

const SelectMainTypes = ({ value, onChange, isFilter = false }: Props) => {
  const { data: mainTypes = [] } = useMainTypes();

  return (
    <FormControl fullWidth>
      <InputLabel id="criterio-simple-select-label">Criterio</InputLabel>
      <Select
        labelId="criterio-simple-select-label"
        id="criterio-simple-select"
        label="Criterio"
        value={value}
        onChange={onChange}
      >
        {isFilter && <MenuItem value="">Ninguno</MenuItem>}
        {mainTypes.map((mainType) => (
          <MenuItem key={mainType.id} value={mainType.id}>
            {mainType.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectMainTypes;
