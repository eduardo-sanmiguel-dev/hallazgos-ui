import ChartCard from "../_components/ChartCard";
import {
  BiData,
  periodNames,
  formatNumber,
  toNumber,
  useBiColors,
} from "../_lib/biEpp";

const TOP = 10;

// Unidades por equipo: mes en curso a la fecha vs los mismos días del anterior.
export default function UnitsByEquipmentChart({ data }: { data: BiData }) {
  const colors = useBiColors();
  // Mismos días de cada mes (ver kpis.periodo de la API).
  const { currentName, previousName } = periodNames(data);

  const rows = [...(data.chart4 ?? [])].sort(
    (a, b) =>
      toNumber(b.unidades_mes_actual) - toNumber(a.unidades_mes_actual) ||
      toNumber(b.unidades_mes_anterior) - toNumber(a.unidades_mes_anterior),
  );
  const top = rows.slice(0, TOP);

  return (
    <ChartCard
      title="Equipos más entregados"
      description={
        rows.length > TOP
          ? `Top ${TOP} de ${rows.length} equipos por unidades de ${currentName}. La tabla muestra todos.`
          : `Unidades de ${currentName} contra ${previousName}.`
      }
      isEmpty={!rows.length}
      height={Math.max(260, top.length * 44 + 70)}
      options={{
        chart: { type: "bar" },
        xAxis: { categories: top.map((row) => row.equipment_name) },
        yAxis: { min: 0, allowDecimals: false },
        tooltip: { shared: true, valueSuffix: " uds" },
        series: [
          {
            type: "bar",
            name: previousName,
            color: colors.previous,
            data: top.map((row) => toNumber(row.unidades_mes_anterior)),
          },
          {
            type: "bar",
            name: currentName,
            color: colors.current,
            data: top.map((row) => toNumber(row.unidades_mes_actual)),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: `Unidades ${previousName}`, numeric: true },
          { label: `Unidades ${currentName}`, numeric: true },
          { label: `Colaboradores ${previousName}`, numeric: true },
          { label: `Colaboradores ${currentName}`, numeric: true },
        ],
        rows: rows.map((row) => [
          row.equipment_name,
          formatNumber(toNumber(row.unidades_mes_anterior)),
          formatNumber(toNumber(row.unidades_mes_actual)),
          formatNumber(toNumber(row.empleados_mes_anterior)),
          formatNumber(toNumber(row.empleados_mes_actual)),
        ]),
      }}
    />
  );
}
