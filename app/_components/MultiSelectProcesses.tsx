import { useEffect, useMemo, useState } from "react";

import { Theme, useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import { OutlinedInput } from "@mui/material";
import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";
import { Chip } from "@mui/material";
import type { MenuProps as MuiMenuProps } from "@mui/material";

import { useProcesses } from "@hooks";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
// MUI 9 ya no acepta PaperProps en el menú: se pasa por slotProps.paper.
const MenuProps: Partial<MuiMenuProps> = {
  slotProps: {
    paper: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  },
};

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  manufacturingPlantNames: string[];
}

export default function MultiSelectProcesses({
  values,
  onChange,
  manufacturingPlantNames,
}: Props) {
  const theme = useTheme();
  const [labelSelectAll, setLabelSelectAll] = useState("Todos");

  const { data: processes } = useProcesses({ manufacturingPlantNames });

  const names = useMemo(
    () =>
      (processes ?? []).map(
        (process) => `${process.manufacturingPlant.name} - ${process.name}`,
      ),
    [processes],
  );

  useEffect(() => {
    if (!values.length) {
      setLabelSelectAll("Todos");
    } else if (values.length === names.length) {
      setLabelSelectAll("Ninguno");
    } else {
      setLabelSelectAll("Todos");
    }
  }, [values, names]);

  useEffect(() => {
    if (!manufacturingPlantNames.length) return onChange([]);

    const processesFiltered = values.filter((value) => {
      const [manufacturingPlantName] = value.split(" - ");
      return manufacturingPlantNames.includes(manufacturingPlantName);
    });

    onChange(processesFiltered);
  }, [manufacturingPlantNames]);

  const handleChange = ({
    target: { value },
  }: SelectChangeEvent<typeof values>) => {
    if (value.includes("none-all")) {
      if (values.length === names.length) {
        onChange([]);
        return;
      } else {
        onChange(names);
        return;
      }
    }
    onChange(typeof value === "string" ? value.split(",") : value);
  };

  return (
    <div>
      <FormControl sx={{ width: "100%" }}>
        <InputLabel id="processes-multiple-chip-label">
          Procesos (opcional)
        </InputLabel>
        <Select
          labelId="processes-multiple-chip-label"
          id="processes-multiple-chip"
          multiple
          value={values}
          onChange={handleChange}
          input={
            <OutlinedInput
              id="select-multiple-chip-processes"
              label="Procesos (opcional)"
            />
          }
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
        >
          <MenuItem value="none-all">{labelSelectAll}</MenuItem>
          {names
            .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
            .map((name) => (
              <MenuItem
                key={name}
                value={name}
                style={getStyles(name, values, theme)}
              >
                {name}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    </div>
  );
}
