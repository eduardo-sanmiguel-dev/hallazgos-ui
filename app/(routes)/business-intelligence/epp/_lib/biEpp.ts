import { useTheme } from "@mui/material/styles";

import type { BusinessIntelligenceEpp } from "@interfaces";

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

const pgMonthLabel = (date: Date) =>
  `${PG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;

export const currentAndPreviousMonth = (now = new Date()) => {
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const longName = (date: Date) =>
    date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return {
    currentKey: pgMonthLabel(current),
    previousKey: pgMonthLabel(previous),
    currentName: longName(current),
    previousName: longName(previous),
  };
};

const sum = <T>(rows: T[], pick: (row: T) => string | number) =>
  rows.reduce((total, row) => total + toNumber(pick(row)), 0);

export interface KpiValue {
  current: number;
  previous: number;
}

export interface BiKpis {
  spend: KpiValue;
  units: KpiValue;
  // Porcentaje de colaboradores activos con al menos una entrega en el mes.
  coverage: KpiValue & { withDelivery: number; activeEmployees: number };
  newEmployees: KpiValue;
  // Porcentaje de entregas fuera de rango en el mes (menor es mejor).
  outOfRange: KpiValue & { deliveries: number };
  averagePerEmployee: KpiValue & { globalAverage: number };
}

// Todas las consultas de la API son por planta y sin LIMIT, así que las sumas
// por equipo equivalen a los totales del mes.
export function computeKpis(data: BiData): BiKpis {
  const { currentKey, previousKey } = currentAndPreviousMonth();

  const coverage = data.chart5?.[0];
  const firstDelivery = data.chart6?.[0];

  const outOfRangeCurrent = data.chart3?.find(
    (row) => row.mes_label === currentKey,
  );
  const outOfRangePrevious = data.chart3?.find(
    (row) => row.mes_label === previousKey,
  );

  const averageCurrent = data.chart10?.find(
    (row) => row.mes_label === currentKey,
  );
  const averagePrevious = data.chart10?.find(
    (row) => row.mes_label === previousKey,
  );

  return {
    spend: {
      current: sum(data.chart1 ?? [], (row) => row.gasto_mes_actual),
      previous: sum(data.chart1 ?? [], (row) => row.gasto_mes_anterior),
    },
    units: {
      current: sum(data.chart4 ?? [], (row) => row.unidades_mes_actual),
      previous: sum(data.chart4 ?? [], (row) => row.unidades_mes_anterior),
    },
    coverage: {
      current: toNumber(coverage?.pct_con_entrega_actual),
      previous: toNumber(coverage?.pct_con_entrega_anterior),
      withDelivery: toNumber(coverage?.con_entrega_mes_actual),
      activeEmployees: toNumber(coverage?.total_empleados_activos),
    },
    newEmployees: {
      current: toNumber(firstDelivery?.primera_vez_mes_actual),
      previous: toNumber(firstDelivery?.primera_vez_mes_anterior),
    },
    outOfRange: {
      current: toNumber(outOfRangeCurrent?.pct_fuera_de_rango),
      previous: toNumber(outOfRangePrevious?.pct_fuera_de_rango),
      deliveries: toNumber(outOfRangeCurrent?.total_entregas),
    },
    averagePerEmployee: {
      current: toNumber(averageCurrent?.gasto_promedio_por_empleado),
      previous: toNumber(averagePrevious?.gasto_promedio_por_empleado),
      globalAverage: toNumber(data.promedioGlobalChart10),
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
