// Periodo de los tableros (dashboard de hallazgos y análisis EPP): atajos
// y su rango de fechas (DD/MM/YYYY, el formato que espera la API). La
// comparación la decide la API.

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

// Por omisión los últimos 30 días (M5): con "este mes", los primeros días
// del mes casi no había datos.
export const DEFAULT_PERIOD = (today = new Date()) =>
  presetRange("last30", today);

const ES_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const isoDay = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${ES_MONTHS[month - 1]} ${year}`;
};

/**
 * Rango de la API ('YYYY-MM-DD') → texto corto:
 * - mismo mes: "1–22 oct 2026" (un solo día: "1 oct 2026");
 * - mismo año: "1 ago – 22 oct 2026";
 * - distinto año: "1 dic 2025 – 22 ene 2026".
 */
export const periodLabel = ({
  desde,
  hasta,
}: {
  desde: string;
  hasta: string;
}) => {
  const [y1, m1, d1] = desde.split("-").map(Number);
  const [y2, m2, d2] = hasta.split("-").map(Number);
  if (y1 === y2 && m1 === m2) {
    const days = d1 === d2 ? `${d1}` : `${d1}–${d2}`;
    return `${days} ${ES_MONTHS[m1 - 1]} ${y1}`;
  }
  if (y1 === y2) {
    return `${d1} ${ES_MONTHS[m1 - 1]} – ${d2} ${ES_MONTHS[m2 - 1]} ${y2}`;
  }
  return `${isoDay(desde)} – ${isoDay(hasta)}`;
};
