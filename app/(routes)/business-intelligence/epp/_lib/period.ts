// Periodo del análisis EPP: atajos y su rango de fechas (DD/MM/YYYY, el
// formato que espera la API). La comparación la decide la API.

export type PeriodPreset =
  "last30" | "month" | "lastMonth" | "last3" | "year" | "custom";

export interface PeriodValue {
  preset: PeriodPreset;
  startDate: string;
  endDate: string;
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "last30", label: "Últimos 30 días" },
  { value: "month", label: "Este mes" },
  { value: "lastMonth", label: "Mes anterior" },
  { value: "last3", label: "Últimos 3 meses" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Fecha local → 'DD/MM/YYYY'. */
export const toDdMmYyyy = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

/**
 * Rango de un atajo respecto a `today` (fecha local del navegador).
 * - Últimos 30 días: hoy y los 29 anteriores (la API compara con los 30
 *   días previos).
 * - Este mes: del día 1 a hoy.
 * - Mes anterior: el mes completo.
 * - Últimos 3 meses: desde el día 1 de hace dos meses hasta hoy.
 * - Este año: del 1 de enero a hoy.
 */
export const presetRange = (
  preset: Exclude<PeriodPreset, "custom">,
  today = new Date(),
): PeriodValue => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const ranges: Record<typeof preset, [Date, Date]> = {
    last30: [new Date(year, month, today.getDate() - 29), today],
    month: [new Date(year, month, 1), today],
    lastMonth: [new Date(year, month - 1, 1), new Date(year, month, 0)],
    last3: [new Date(year, month - 2, 1), today],
    year: [new Date(year, 0, 1), today],
  };
  const [start, end] = ranges[preset];
  return { preset, startDate: toDdMmYyyy(start), endDate: toDdMmYyyy(end) };
};

// Por omisión los últimos 30 días, como el dashboard de hallazgos (M5): con
// "este mes", los primeros días del mes casi no había datos.
export const DEFAULT_PERIOD = (today = new Date()) =>
  presetRange("last30", today);
