import ChartCard from "../_components/ChartCard";
import {
  BiData,
  periodNames,
  formatMoney,
  formatPercent,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

const TOP = 10;

// Gasto por equipo: mes en curso a la fecha vs los mismos días del anterior.
export default function SpendByEquipmentChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  // Mismos días de cada mes (ver kpis.periodo de la API).
  const { currentName, previousName } = periodNames(data);

  const rows = [...(data.chart1 ?? [])].sort(
    (a, b) => toNumber(b.gasto_mes_actual) - toNumber(a.gasto_mes_actual),
  );
  const top = rows.slice(0, TOP);

  return (
    <ChartCard
      title="Gasto por equipo"
      description={
        rows.length > TOP
          ? `Top ${TOP} de ${rows.length} equipos por gasto de ${currentName}. La tabla muestra todos.`
          : `Gasto de ${currentName} contra ${previousName}.`
      }
      isEmpty={!rows.length}
      height={Math.max(260, top.length * 44 + 70)}
      options={{
        chart: { type: "bar" },
        xAxis: { categories: top.map((row) => row.equipment_name) },
        yAxis: { min: 0, labels: { format: "${value:,.0f}" } },
        tooltip: { shared: true, valuePrefix: "$", valueDecimals: 2 },
        series: [
          {
            type: "bar",
            name: previousName,
            color: colors.previous,
            data: top.map((row) => toNumber(row.gasto_mes_anterior)),
          },
          {
            type: "bar",
            name: currentName,
            color: colors.current,
            data: top.map((row) => toNumber(row.gasto_mes_actual)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: previousName, numeric: true },
          { label: currentName, numeric: true },
          { label: "Variación", numeric: true },
        ],
        rows: rows.map((row) => {
          const previous = toNumber(row.gasto_mes_anterior);
          const current = toNumber(row.gasto_mes_actual);
          return [
            row.equipment_name,
            formatMoney(previous, 2),
            formatMoney(current, 2),
            // Sin gasto en el periodo anterior no hay variación que calcular.
            previous
              ? formatPercent(((current - previous) / previous) * 100)
              : "—",
          ];
        }),
      }}
    />
  );
}
