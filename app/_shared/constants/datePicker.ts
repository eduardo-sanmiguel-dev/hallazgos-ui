import type { DateView } from "@mui/x-date-pickers/models";

/**
 * Calendario que empieza por el año: año → mes → día, y se cierra al elegir
 * el día (sin "OK" en celular). Para fechas lejanas de hoy (recargas a 1–2
 * años, nacimiento, admisión).
 *
 * Antes se abría en el mes actual: tras elegir el año volvía al mismo mes y
 * había que tocar "Mes anterior/siguiente" varias veces (RUM lo registraba
 * como rage click: ~8–9 toques por fecha en la inspección de extintores).
 */
export const YEAR_FIRST_DATE_PICKER = {
  openTo: "year",
  views: ["year", "month", "day"],
  closeOnSelect: true,
} as const satisfies {
  openTo: DateView;
  views: readonly DateView[];
  closeOnSelect: boolean;
};
