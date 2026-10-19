import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";

import { useZones } from "@hooks";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  isFilter?: boolean;
  manufacturingPlantId: string;
}

const SelectZones = ({
  value,
  onChange,
  isFilter = false,
  manufacturingPlantId,
}: Props) => {
  const { data: zones = [] } = useZones(
    { manufacturingPlantId },
    { enabled: !!manufacturingPlantId },
  );

  return (
    <FormControl fullWidth>
      <InputLabel id="zone-simple-select-label">Zonas</InputLabel>
      <Select
        labelId="zone-simple-select-label"
        id="zone-simple-select"
        label="Zonas"
        value={value}
        onChange={onChange}
        disabled={!manufacturingPlantId}
      >
        {isFilter && <MenuItem value="">Ninguna</MenuItem>}
        {zones.map((zone) => (
          <MenuItem key={zone.id} value={zone.id}>
            {zone.name}
          </MenuItem>
        ))}
      </Select>
      {!manufacturingPlantId && (
        <FormHelperText>Seleccione una planta</FormHelperText>
      )}
    </FormControl>
  );
};

export default SelectZones;
