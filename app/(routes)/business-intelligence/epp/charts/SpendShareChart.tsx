import type Highcharts from "highcharts/esm/highcharts.src.js";

import ChartCard from "../_components/ChartCard";
import {
  BiData,
  formatMoney,
  formatNumber,
  formatPercent,
  toNumber,
  topWithOthers,
  useBiColors,
} from "../_lib/biEpp";

const TOP = 8;

// Participación de cada equipo en el gasto del periodo. Barras ordenadas en
// lugar de dona: con muchos equipos los sectores no se pueden comparar.
export default function SpendShareChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = data.chart9 ?? [];
  const total = rows.reduce((sum, row) => sum + toNumber(row.gasto_total), 0);
  const share = (value: number) => (total ? (value / total) * 100 : 0);

  const { top, othersTotal, othersCount } = topWithOthers(rows, TOP, (row) =>
    toNumber(row.gasto_total),
  );

  const points = [
    ...top.map((row) => ({
      name: row.equipment_name,
      y: share(toNumber(row.gasto_total)),
      custom: { amount: toNumber(row.gasto_total) },
      color: colors.current,
    })),
    ...(othersCount
      ? [
          {
            name: `Otros (${othersCount})`,
            y: share(othersTotal),
            custom: { amount: othersTotal },
            color: colors.previous,
          },
        ]
      : []),
  ];

  return (
    <ChartCard
      title="Participación en el gasto"
      description={`Gasto acumulado: ${formatMoney(total, 2)}`}
      isEmpty={!rows.length}
      height={Math.max(240, points.length * 34 + 50)}
      options={{
        chart: { type: "bar" },
        legend: { enabled: false },
        xAxis: { categories: points.map((point) => point.name) },
        yAxis: { min: 0, labels: { format: "{value}%" } },
        tooltip: {
          pointFormatter: function () {
            const point = this as Highcharts.Point & {
              custom: { amount: number };
            };
            return `Participación: <b>${formatPercent(point.y ?? 0)}</b><br/>Gasto: <b>${formatMoney(point.custom.amount, 2)}</b>`;
          },
        },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true,
              format: "{point.y:.1f}%",
              style: { fontWeight: "500", textOutline: "none" },
            },
          },
        },
        series: [{ type: "bar", name: "Participación", data: points }],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: "Gasto total", numeric: true },
          { label: "Unidades", numeric: true },
          { label: "Participación", numeric: true },
        ],
        rows: [...rows]
          .sort((a, b) => toNumber(b.gasto_total) - toNumber(a.gasto_total))
          .map((row) => [
            row.equipment_name,
            formatMoney(toNumber(row.gasto_total), 2),
            formatNumber(toNumber(row.unidades_total)),
            formatPercent(share(toNumber(row.gasto_total))),
          ]),
      }}
    />
  );
}
