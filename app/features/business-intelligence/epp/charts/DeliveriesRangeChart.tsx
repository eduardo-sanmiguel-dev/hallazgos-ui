import ChartCard from "../_components/ChartCard";
import {
  BiData,
  formatNumber,
  formatPercent,
  monthLabelEs,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

// Entregas por mes, separadas en dentro y fuera de la frecuencia permitida.
// El % fuera de rango va en el tooltip y la tabla (sin segundo eje).
export default function DeliveriesRangeChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = data.chart3 ?? [];

  return (
    <ChartCard
      title="Entregas en rango vs fuera de rango"
      description="Entregas por mes según la frecuencia de entrega del equipo."
      isEmpty={!rows.length}
      options={{
        chart: { type: "column" },
        xAxis: { categories: rows.map((row) => monthLabelEs(row.mes_label)) },
        yAxis: { min: 0, allowDecimals: false },
        tooltip: { shared: true },
        plotOptions: {
          column: {
            stacking: "normal",
            // Separación de 2px entre segmentos apilados.
            borderWidth: 2,
            borderColor: colors.surface,
          },
        },
        series: [
          {
            type: "column",
            name: "Fuera de rango",
            color: colors.alert,
            data: rows.map((row) => ({
              y: toNumber(row.fuera_de_rango),
              custom: { pct: toNumber(row.pct_fuera_de_rango) },
            })),
            tooltip: {
              pointFormat:
                '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y}</b> ({point.custom.pct:.1f}%)<br/>',
            },
          },
          {
            type: "column",
            name: "En rango",
            color: colors.current,
            data: rows.map((row) => toNumber(row.en_rango)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Mes" },
          { label: "Total", numeric: true },
          { label: "En rango", numeric: true },
          { label: "Fuera de rango", numeric: true },
          { label: "% fuera de rango", numeric: true },
        ],
        rows: rows.map((row) => [
          monthLabelEs(row.mes_label),
          formatNumber(toNumber(row.total_entregas)),
          formatNumber(toNumber(row.en_rango)),
          formatNumber(toNumber(row.fuera_de_rango)),
          formatPercent(toNumber(row.pct_fuera_de_rango)),
        ]),
      }}
    />
  );
}
