import ChartCard from "../_components/ChartCard";
import {
  BiData,
  formatMoney,
  formatNumber,
  monthLabelEs,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

// Gasto promedio por colaborador con entrega, con el promedio global como
// línea de referencia.
export default function AverageSpendChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = data.chart10 ?? [];
  const globalAverage = toNumber(data.promedioGlobalChart10);

  return (
    <ChartCard
      title="Gasto promedio por colaborador"
      description={`Promedio global ponderado: ${formatMoney(globalAverage, 2)}`}
      isEmpty={!rows.length}
      options={{
        chart: { type: "line" },
        legend: { enabled: false },
        xAxis: {
          categories: rows.map((row) => monthLabelEs(row.mes_label)),
          crosshair: true,
        },
        yAxis: {
          min: 0,
          labels: { format: "${value:,.0f}" },
          plotLines: [
            {
              value: globalAverage,
              color: colors.reference,
              dashStyle: "ShortDash",
              width: 1,
              zIndex: 3,
              label: {
                text: "Promedio global",
                align: "right",
                x: -4,
                style: { color: colors.reference, fontSize: "11px" },
              },
            },
          ],
        },
        tooltip: { valuePrefix: "$", valueDecimals: 2 },
        series: [
          {
            type: "line",
            name: "Gasto promedio",
            color: colors.current,
            lineWidth: 2,
            marker: { enabled: true, radius: 4, symbol: "circle" },
            data: rows.map((row) => toNumber(row.gasto_promedio_por_empleado)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Mes" },
          { label: "Gasto promedio", numeric: true },
          { label: "Colaboradores con entrega", numeric: true },
          { label: "Gasto total", numeric: true },
        ],
        rows: rows.map((row) => [
          monthLabelEs(row.mes_label),
          formatMoney(toNumber(row.gasto_promedio_por_empleado), 2),
          formatNumber(toNumber(row.empleados_con_entrega)),
          formatMoney(toNumber(row.gasto_total), 2),
        ]),
      }}
    />
  );
}
