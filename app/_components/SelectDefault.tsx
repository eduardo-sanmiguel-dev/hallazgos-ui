import { useId } from "react";
import { Paper } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { Checkbox } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { TextField } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
//import { FormHelperText } from "@mui/material";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface Props {
  value: string | string[];
  onChange: (event: any, newValue: any) => void;
  data: any[];
  label: string;
  multiple?: boolean;
  isFilter?: boolean;
  helperText?: string;
  attention?: string;
  validationEmpty?: boolean;
  disabled?: boolean;
  name?: string;
  // Opciones en camino: spinner en el campo y "Cargando…" al abrir la lista.
  loading?: boolean;
}

export default function SelectDefault({
  value,
  onChange,
  data,
  label,
  multiple = false,
  isFilter = false,
  helperText,
  attention,
  validationEmpty = false,
  disabled = false,
  name = "",
  loading = false,
}: Props) {
  const autocompleteId = useId();
  const selectedOption = multiple
    ? data.filter((item) =>
        Array.isArray(value) ? value.includes(String(item.id)) : false,
      )
    : data.find((item) => String(item.id) === value) || null;

  return (
    <Paper>
      <Autocomplete
        id={autocompleteId}
        fullWidth
        multiple={multiple}
        value={selectedOption}
        onChange={(_, newValue) => {
          // Crear un objeto similar a SelectChangeEvent para mantener compatibilidad
          const syntheticEvent = {
            target: {
              value: multiple
                ? Array.isArray(newValue)
                  ? newValue.map((item) => String(item.id))
                  : []
                : newValue
                  ? String(newValue.id)
                  : "",
              name: name,
            },
          };
          onChange(syntheticEvent as any, newValue);
        }}
        options={data}
        disableCloseOnSelect={multiple}
        getOptionLabel={(option) => option.name || ""}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        renderOption={(props, option, { selected }) => {
          // Por id: puede haber nombres repetidos (p. ej. zonas de distintas
          // plantas) y MUI usa la etiqueta como key.
          const { key: _key, ...optionProps } = props;

          return (
            <li key={option.id} {...optionProps}>
              {multiple && (
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  checked={selected}
                  sx={{ mr: 1 }}
                />
              )}
              {option.name || ""}
            </li>
          );
        }}
        renderValue={(selected) => {
          if (multiple) {
            const text = (selected as Array<{ name?: string }>)
              .map((item) => item.name || "")
              .join(", ");

            return (
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "block",
                  maxWidth: "100%",
                }}
              >
                {text}
              </span>
            );
          }

          return (selected as { name?: string } | null)?.name || "";
        }}
        disabled={!!helperText || disabled}
        loading={loading}
        loadingText="Cargando…"
        renderInput={(params) => (
          <TextField
            {...params}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                ...(loading && {
                  endAdornment: (
                    <>
                      <CircularProgress
                        color="inherit"
                        size={18}
                        aria-label={`Cargando ${label}`}
                      />
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                }),
              },
            }}
            label={label}
            error={
              !validationEmpty
                ? false
                : Array.isArray(value)
                  ? value.length === 0
                  : value === ""
            }
            helperText={helperText || attention}
            name={name}
          />
        )}
        noOptionsText="No hay opciones"
        clearText="Limpiar"
        openText="Abrir"
        closeText="Cerrar"
        {...(isFilter && { clearOnEscape: true })}
      />
    </Paper>
  );
}

/* import { Paper } from "@mui/material";
import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";
import { FormHelperText } from "@mui/material";

interface Props {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  data: any[];
  label: string;
  isFilter?: boolean;
  helperText?: string;
  attention?: string;
  validationEmpty?: boolean;
  disabled?: boolean;
  name?: string;
}

export default function SelectDefault({
  value,
  onChange,
  data,
  label,
  isFilter = false,
  helperText,
  attention,
  validationEmpty = false,
  disabled = false,
  name = "",
}: Props) {
  return (
    <Paper>
      <FormControl
        fullWidth
        error={!validationEmpty ? false : value === "" ? true : false}
      >
        <InputLabel id={`${label}-simple-select-helper-label`}>
          {label}
        </InputLabel>
        <Select
          labelId={`${label}-simple-select-helper-label`}
          id={`${label}-simple-select-helper`}
          value={value}
          label={label}
          onChange={onChange}
          disabled={!!helperText || disabled}
          name={name}
        >
          {isFilter && (
            <MenuItem value="">
              <em>Ninguno</em>
            </MenuItem>
          )}

          {data.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
        {attention && <FormHelperText>{attention}</FormHelperText>}
      </FormControl>
    </Paper>
  );
} */
