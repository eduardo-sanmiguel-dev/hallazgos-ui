import { Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

const VALUE_FORMAT = "YYYY-MM-DD";

interface Props {
  label: string;
  // YYYY-MM-DD o "" (sin fecha)
  value: string;
  onChange: (value: string) => void;
  minDate?: Dayjs;
  error?: boolean;
}

// Fecha mostrada siempre como DD/MM/YYYY, sin depender del idioma del navegador.
export default function DateFieldDMY({
  label,
  value,
  onChange,
  minDate,
  error = false,
}: Props) {
  return (
    <Paper>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="es"
        localeText={
          esES.components.MuiLocalizationProvider.defaultProps.localeText
        }
      >
        <DatePicker
          label={label}
          format="DD/MM/YYYY"
          minDate={minDate}
          value={value ? dayjs(value) : null}
          onChange={(newValue: Dayjs | null) =>
            onChange(
              newValue && newValue.isValid()
                ? newValue.format(VALUE_FORMAT)
                : "",
            )
          }
          slotProps={{
            textField: {
              fullWidth: true,
              error,
            },
            field: { clearable: true },
          }}
        />
      </LocalizationProvider>
    </Paper>
  );
}
