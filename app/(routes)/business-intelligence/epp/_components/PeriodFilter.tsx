"use client";

import type { Dayjs } from "dayjs";
import "dayjs/locale/es";

import dayjs from "@shared/libs/dayjs";

import { Box, MenuItem, TextField } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";

import {
  PERIOD_PRESETS,
  presetRange,
  type PeriodPreset,
  type PeriodValue,
} from "../_lib/period";

const FORMAT = "DD/MM/YYYY";
const parse = (value: string) => (value ? dayjs(value, FORMAT) : null);

interface Props {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
}

// Periodo del análisis: atajos comunes y, en "Personalizado", dos fechas.
// La comparación (periodo anterior equivalente) la calcula la API.
export default function PeriodFilter({ value, onChange }: Props) {
  const changePreset = (preset: PeriodPreset) =>
    // Personalizado parte del rango que ya se veía.
    onChange(preset === "custom" ? { ...value, preset } : presetRange(preset));

  const changeDate = (key: "startDate" | "endDate") => (date: Dayjs | null) => {
    // Mientras se escribe la fecha pasa por valores incompletos: se ignoran.
    if (!date || !date.isValid()) return;
    const next = {
      ...value,
      preset: "custom" as const,
      [key]: date.format(FORMAT),
    };
    const start = parse(next.startDate);
    const end = parse(next.endDate);
    if (start && end && start.isAfter(end)) return;
    onChange(next);
  };

  return (
    <Box
      // En celular ocupa todo el ancho, como el selector de planta.
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        flex: { xs: "1 1 100%", sm: "0 0 auto" },
        "& > *": { flex: { xs: "1 1 100%", sm: "0 0 auto" } },
      }}
    >
      <TextField
        select
        label="Periodo"
        value={value.preset}
        onChange={(event) => changePreset(event.target.value as PeriodPreset)}
        sx={{ minWidth: 180 }}
      >
        {PERIOD_PRESETS.map(({ value: preset, label }) => (
          <MenuItem key={preset} value={preset}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      {value.preset === "custom" && (
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="es"
          localeText={
            esES.components.MuiLocalizationProvider.defaultProps.localeText
          }
        >
          <DatePicker
            label="Desde"
            format={FORMAT}
            value={parse(value.startDate)}
            maxDate={parse(value.endDate) ?? dayjs()}
            onChange={changeDate("startDate")}
            slotProps={{ textField: { sx: { width: { sm: 180 } } } }}
          />
          <DatePicker
            label="Hasta"
            format={FORMAT}
            value={parse(value.endDate)}
            minDate={parse(value.startDate) ?? undefined}
            maxDate={dayjs()}
            onChange={changeDate("endDate")}
            slotProps={{ textField: { sx: { width: { sm: 180 } } } }}
          />
        </LocalizationProvider>
      )}
    </Box>
  );
}
