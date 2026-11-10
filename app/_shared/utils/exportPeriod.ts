// Período del Excel de hallazgos (DD/MM/YYYY, el formato de la API). Mismas
// reglas que valida la API: inicio y fin obligatorios y hasta 12 meses por
// descarga. Se proponen los últimos 90 días para no exportar todo el
// histórico por omisión.

import { toDdMmYyyy } from "./period";

export const EXPORT_DEFAULT_DAYS = 90;
// Igual que EXPORT_MAX_MONTHS de la API (evidences.service.ts).
export const EXPORT_MAX_MONTHS = 12;

export interface ExportPeriod {
  startDate: string;
  endDate: string;
}

/** 'DD/MM/YYYY' → fecha local, o null si no es una fecha real. */
export const parseDdMmYyyy = (value: string): Date | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
};

/** Hoy y los 89 días anteriores. */
export const defaultExportPeriod = (today = new Date()): ExportPeriod => ({
  startDate: toDdMmYyyy(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - (EXPORT_DEFAULT_DAYS - 1)),
  ),
  endDate: toDdMmYyyy(today),
});

/** Motivo por el que no se puede exportar el período, o null si es válido. */
export const exportPeriodError = ({ startDate, endDate }: ExportPeriod): string | null => {
  if (!startDate || !endDate) return "Seleccione la fecha de inicio y la de fin";
  const start = parseDdMmYyyy(startDate);
  const end = parseDdMmYyyy(endDate);
  if (!start || !end) return "Escriba fechas válidas (DD/MM/AAAA)";
  if (start > end) return "La fecha de inicio no puede ser mayor a la de fin";
  const limit = new Date(
    start.getFullYear(),
    start.getMonth() + EXPORT_MAX_MONTHS,
    start.getDate(),
  );
  if (end >= limit) return `El período no puede superar ${EXPORT_MAX_MONTHS} meses`;
  return null;
};

/** Período inicial: el de la lista si es válido; si no, los últimos 90 días. */
export const initialExportPeriod = (listPeriod: ExportPeriod, today = new Date()): ExportPeriod =>
  exportPeriodError(listPeriod) ? defaultExportPeriod(today) : listPeriod;

/** Planta inicial: la de la lista; con una sola planta, esa; si no, todas (""). */
export const initialExportPlant = (listPlantId: string, plants: Array<{ id: number }>): string =>
  listPlantId || (plants.length === 1 ? String(plants[0].id) : "");
