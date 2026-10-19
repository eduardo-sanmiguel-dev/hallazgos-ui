import ChartCard from "../_components/ChartCard";
import {
  BiData,
  currentAndPreviousMonth,
  formatNumber,
  formatPercent,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

// Cobertura de colaboradores activos: con y sin entrega en cada mes.
// Barra 100% apilada en lugar de dos donas de 2 sectores.
export default function CoverageChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const { currentName, previousName } = currentAndPreviousMonth();
  const row = data.chart5?.[0];

  const months = [
    {
      name: previousName,
      with: toNumber(row?.con_entrega_mes_anterior),
      without: toNumber(row?.sin_entrega_mes_anterior),
      pct: toNumber(row?.pct_con_entrega_anterior),
    },
    {
      name: currentName,
      with: toNumber(row?.con_entrega_mes_actual),
      without: toNumber(row?.sin_entrega_mes_actual),
      pct: toNumber(row?.pct_con_entrega_actual),
    },
  ];

  const activeEmployees = toNumber(row?.total_empleados_activos);

  return (
    <ChartCard
      title="Cobertura de entregas"
      description={`${formatNumber(activeEmployees)} colaboradores activos en la planta.`}
      isEmpty={!activeEmployees}
      height={220}
      options={{
        chart: { type: "bar" },
        xAxis: { categories: months.map((month) => month.name) },
        yAxis: { min: 0, max: 100, labels: { format: "{value}%" } },
        tooltip: {
          shared: true,
          pointFormat:
            '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y}</b> ({point.percentage:.1f}%)<br/>',
        },
        plotOptions: {
          bar: {
            stacking: "percent",
            borderWidth: 2,
            borderColor: colors.surface,
            dataLabels: {
              enabled: true,
              format: "{point.percentage:.0f}%",
              // Sin etiqueta en segmentos donde no cabe.
              filter: { property: "percentage", operator: ">", value: 6 },
              style: { fontWeight: "600", textOutline: "none" },
              color: "#ffffff",
            },
          },
        },
        series: [
          {
            type: "bar",
            name: "Sin entrega",
            color: colors.previous,
            data: months.map((month) => month.without),
          },
          {
            type: "bar",
            name: "Con entrega",
            color: colors.current,
            data: months.map((month) => month.with),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Mes" },
          { label: "Con entrega", numeric: true },
          { label: "Sin entrega", numeric: true },
          { label: "% cobertura", numeric: true },
        ],
        rows: months.map((month) => [
          month.name,
          formatNumber(month.with),
          formatNumber(month.without),
          formatPercent(month.pct),
        ]),
      }}
    />
  );
}
