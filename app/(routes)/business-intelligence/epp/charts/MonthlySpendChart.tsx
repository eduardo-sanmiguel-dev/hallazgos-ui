import ChartCard from "../_components/ChartCard";
import {
  BiData,
  formatMoney,
  formatNumber,
  monthLabelEs,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

// Gasto total por mes (histórico). Una sola escala: los colaboradores con
// entrega tienen su propia gráfica en "Entregas".
export default function MonthlySpendChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = data.chart8 ?? [];

  const totalUnits = rows.reduce(
    (total, row) => total + toNumber(row.unidades_total),
    0,
  );

  return (
    <ChartCard
      title="Gasto total por mes"
      description={`Histórico de la planta · ${formatNumber(totalUnits)} unidades entregadas en total.`}
      isEmpty={!rows.length}
      options={{
        chart: { type: "column" },
        legend: { enabled: false },
        xAxis: { categories: rows.map((row) => monthLabelEs(row.mes_label)) },
        yAxis: { min: 0, labels: { format: "${value:,.0f}" } },
        tooltip: { valuePrefix: "$", valueDecimals: 2 },
        series: [
          {
            type: "column",
            name: "Gasto total",
            color: colors.current,
            data: rows.map((row) => toNumber(row.gasto_total)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Mes" },
          { label: "Gasto total", numeric: true },
          { label: "Unidades", numeric: true },
          { label: "Colaboradores con entrega", numeric: true },
        ],
        rows: rows.map((row) => [
          monthLabelEs(row.mes_label),
          formatMoney(toNumber(row.gasto_total), 2),
          formatNumber(toNumber(row.unidades_total)),
          formatNumber(toNumber(row.empleados_con_entrega)),
        ]),
      }}
    />
  );
}
