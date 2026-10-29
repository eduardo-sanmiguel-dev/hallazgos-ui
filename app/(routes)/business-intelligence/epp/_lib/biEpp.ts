import { useTheme } from "@mui/material/styles";

import type { BusinessIntelligenceEpp } from "@interfaces";
import { periodLabel } from "@shared/utils/period";

export { periodLabel };

export type BiData = BusinessIntelligenceEpp;

// Colores validados (CVD y contraste) contra la superficie de cada modo.
// - current:  serie principal (mes actual, en rango, con entrega).
// - previous: contexto atenuado (mes anterior, sin entrega, "Otros").
// - alert:    segunda serie con significado de alerta (fuera de rango).
const BI_COLORS = {
  light: { current: "#2a78d6", previous: "#8b8a85", alert: "#eb6834" },
  dark: { current: "#3987e5", previous: "#6b6a66", alert: "#d95926" },
};

export function useBiColors() {
  const theme = useTheme();
  return {
    ...BI_COLORS[theme.palette.mode],
    reference: theme.palette.text.secondary,
    surface: theme.palette.background.paper,
  };
}

export const toNumber = (value: string | number | null | undefined) =>
  Number(value ?? 0) || 0;

export const formatMoney = (value: number, decimals = 0) =>
  `$${value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

export const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

export const formatPercent = (value: number, decimals = 1) =>
  `${formatNumber(value, decimals)}%`;

// PostgreSQL devuelve TO_CHAR(..., 'Mon YYYY') en inglés ("Oct 2026").
const PG_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
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

export const monthLabelEs = (pgLabel: string) => {
  const [month, year] = pgLabel.split(" ");
  const index = PG_MONTHS.indexOf(month);
  return index === -1 ? pgLabel : `${ES_MONTHS[index]} ${year}`;
};

/** 'YYYY-MM-DD' → "20 oct 2026" (sin zona horaria). */
export const formatIsoDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${ES_MONTHS[month - 1]} ${year}`;
};

/** Nombres del periodo elegido y de su periodo de comparación. */
export const periodNames = (data: BiData) => ({
  currentName: periodLabel(data.kpis.periodo.actual),
  previousName: periodLabel(data.kpis.periodo.anterior),
});

export interface KpiValue {
  current: number;
  previous: number;
}

export interface BiKpis {
  spend: KpiValue;
  units: KpiValue;
  newEmployees: KpiValue;
  // Porcentaje de entregas fuera de rango (menor es mejor).
  outOfRange: KpiValue & { deliveries: number };
  averagePerEmployee: KpiValue & { globalAverage: number };
}

const percentOf = (part: number, total: number) =>
  total ? (part * 100) / total : 0;

const perEmployee = (spend: number, employees: number) =>
  employees ? spend / employees : 0;

// La API ya entrega ambos periodos "a la fecha"; aquí solo se derivan
// porcentajes y promedios.
export function computeKpis({ kpis }: BiData): BiKpis {
  const { actual, anterior } = kpis;
  return {
    spend: { current: actual.gasto, previous: anterior.gasto },
    units: { current: actual.unidades, previous: anterior.unidades },
    newEmployees: { current: actual.primeraVez, previous: anterior.primeraVez },
    outOfRange: {
      current: percentOf(actual.fueraDeRango, actual.entregas),
      previous: percentOf(anterior.fueraDeRango, anterior.entregas),
      deliveries: actual.entregas,
    },
    averagePerEmployee: {
      current: perEmployee(actual.gasto, actual.empleados),
      previous: perEmployee(anterior.gasto, anterior.empleados),
      globalAverage: kpis.promedioGlobal,
    },
  };
}

// Los primeros `limit` elementos y el resto agregado en "Otros".
export function topWithOthers<T>(
  rows: T[],
  limit: number,
  value: (row: T) => number,
) {
  const sorted = [...rows].sort((a, b) => value(b) - value(a));
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  return {
    top,
    othersTotal: rest.reduce((total, row) => total + value(row), 0),
    othersCount: rest.length,
  };
}
