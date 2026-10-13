import { Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

const VALUE_FORMAT = "HH:mm";

interface Props {
  label: string;
  // HH:mm o "" (sin hora)
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

// Hora en formato 24 h (HH:mm) con el selector de MUI, que respeta el tema claro/oscuro.
export default function TimeFieldHM({
  label,
  value,
  onChange,
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
        <TimePicker
          label={label}
          format={VALUE_FORMAT}
          ampm={false}
          value={value ? dayjs(`2000-01-01T${value}`) : null}
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
          }}
        />
      </LocalizationProvider>
    </Paper>
  );
}
