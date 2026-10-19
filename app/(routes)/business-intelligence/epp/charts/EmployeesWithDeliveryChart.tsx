import ChartCard from "../_components/ChartCard";
import {
  BiData,
  formatNumber,
  monthLabelEs,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

// Colaboradores distintos que recibieron al menos un EPP en cada mes.
export default function EmployeesWithDeliveryChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = data.chart8 ?? [];

  return (
    <ChartCard
      title="Colaboradores con entrega por mes"
      description="Colaboradores distintos que recibieron al menos un equipo."
      isEmpty={!rows.length}
      options={{
        chart: { type: "line" },
        legend: { enabled: false },
        xAxis: {
          categories: rows.map((row) => monthLabelEs(row.mes_label)),
          crosshair: true,
        },
        yAxis: { min: 0, allowDecimals: false },
        series: [
          {
            type: "line",
            name: "Colaboradores con entrega",
            color: colors.current,
            lineWidth: 2,
            marker: { enabled: true, radius: 4, symbol: "circle" },
            data: rows.map((row) => toNumber(row.empleados_con_entrega)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Mes" },
          { label: "Colaboradores con entrega", numeric: true },
          { label: "Unidades", numeric: true },
        ],
        rows: rows.map((row) => [
          monthLabelEs(row.mes_label),
          formatNumber(toNumber(row.empleados_con_entrega)),
          formatNumber(toNumber(row.unidades_total)),
        ]),
      }}
    />
  );
}
