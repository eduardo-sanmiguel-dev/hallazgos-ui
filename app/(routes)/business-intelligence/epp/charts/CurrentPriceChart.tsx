import ChartCard from "../_components/ChartCard";
import { BiData, formatMoney, toNumber, useBiColors } from "../_lib/biEpp";

// Precio vigente de cada equipo, ordenado de mayor a menor.
export default function CurrentPriceChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = [...(data.chart2 ?? [])].sort(
    (a, b) => toNumber(b.precio_actual) - toNumber(a.precio_actual),
  );

  return (
    <ChartCard
      title="Precio vigente por equipo"
      description="Último precio registrado de cada equipo activo."
      isEmpty={!rows.length}
      height={Math.max(240, rows.length * 30 + 50)}
      options={{
        chart: { type: "bar" },
        legend: { enabled: false },
        xAxis: { categories: rows.map((row) => row.equipment_name) },
        yAxis: { min: 0, labels: { format: "${value:,.0f}" } },
        tooltip: { valuePrefix: "$", valueDecimals: 2 },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true,
              format: "${point.y:,.2f}",
              style: { fontWeight: "500", textOutline: "none" },
            },
          },
        },
        series: [
          {
            type: "bar",
            name: "Precio vigente",
            color: colors.current,
            data: rows.map((row) => toNumber(row.precio_actual)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: "Precio vigente", numeric: true },
          { label: "Fecha de captura" },
        ],
        rows: rows.map((row) => [
          row.equipment_name,
          formatMoney(toNumber(row.precio_actual), 2),
          row.fecha_captura ? String(row.fecha_captura).slice(0, 10) : "—",
        ]),
      }}
    />
  );
}
