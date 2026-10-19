import ChartCard from "../_components/ChartCard";
import { BiData, formatNumber, toNumber, useBiColors } from "../_lib/biEpp";

// Equipos que recibieron los colaboradores con su primera entrega de EPP.
export default function NewEmployeesEquipmentChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  const rows = [...(data.chart7 ?? [])].sort(
    (a, b) =>
      toNumber(b.empleados_nuevos_que_lo_recibieron) -
      toNumber(a.empleados_nuevos_que_lo_recibieron),
  );

  return (
    <ChartCard
      title="Equipos entregados a colaboradores nuevos"
      description="Colaboradores con su primera entrega de EPP en el mes actual."
      isEmpty={!rows.length}
      height={Math.max(220, rows.length * 30 + 50)}
      options={{
        chart: { type: "bar" },
        legend: { enabled: false },
        xAxis: { categories: rows.map((row) => row.equipment_name) },
        yAxis: { min: 0, allowDecimals: false },
        plotOptions: {
          bar: {
            dataLabels: {
              enabled: true,
              style: { fontWeight: "500", textOutline: "none" },
            },
          },
        },
        series: [
          {
            type: "bar",
            name: "Colaboradores nuevos",
            color: colors.current,
            data: rows.map((row) =>
              toNumber(row.empleados_nuevos_que_lo_recibieron),
            ),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: "Colaboradores nuevos", numeric: true },
        ],
        rows: rows.map((row) => [
          row.equipment_name,
          formatNumber(toNumber(row.empleados_nuevos_que_lo_recibieron)),
        ]),
      }}
    />
  );
}
