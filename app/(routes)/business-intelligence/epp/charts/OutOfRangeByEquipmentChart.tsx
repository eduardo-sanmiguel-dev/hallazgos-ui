import type { BiEppOutOfRangeEquipment } from "@interfaces";

import ChartCard from "../_components/ChartCard";
import { formatNumber, formatPercent, useBiColors } from "../_lib/biEpp";

const TOP = 10;

const daysEarly = (days: number | null) =>
  days === null ? "—" : `${formatNumber(days)} días`;

interface Props {
  rows: BiEppOutOfRangeEquipment[];
  selectedEquipmentId: number | null;
  // Clic en una barra: filtra el ranking a ese equipo (otra vez, lo quita).
  onSelect: (equipmentId: number | null) => void;
}

// Equipos más entregados fuera de rango en el periodo.
export default function OutOfRangeByEquipmentChart({
  rows,
  selectedEquipmentId,
  onSelect,
}: Props) {
  const colors = useBiColors();
  const top = rows.slice(0, TOP);

  return (
    <ChartCard
      title="Equipos más entregados fuera de rango"
      description={
        rows.length > TOP
          ? `Top ${TOP} de ${rows.length} equipos. Haz clic en una barra para ver a quién se le entregó.`
          : "Haz clic en una barra para ver a quién se le entregó."
      }
      isEmpty={!rows.length}
      emptyText="Ninguna entrega fuera de rango en el periodo."
      height={Math.max(240, top.length * 40 + 60)}
      options={{
        chart: { type: "bar" },
        legend: { enabled: false },
        xAxis: { categories: top.map((row) => row.equipmentName) },
        yAxis: { min: 0, allowDecimals: false },
        tooltip: {
          useHTML: true,
          formatter() {
            const row = top[this.index];
            return [
              `<b>${row.equipmentName}</b>`,
              `Fuera de rango: <b>${formatNumber(row.outOfRange)}</b> de ${formatNumber(row.deliveries)} (${formatPercent((row.outOfRange * 100) / row.deliveries)})`,
              `Colaboradores: ${formatNumber(row.employees)}`,
              `Anticipación promedio: ${daysEarly(row.averageDaysEarly)}`,
            ].join("<br/>");
          },
        },
        plotOptions: {
          series: {
            cursor: "pointer",
            dataLabels: { enabled: true },
            point: {
              events: {
                click() {
                  const { equipmentId } = top[this.index];
                  onSelect(
                    equipmentId === selectedEquipmentId ? null : equipmentId,
                  );
                },
              },
            },
          },
        },
        series: [
          {
            type: "bar",
            name: "Fuera de rango",
            data: top.map((row) => ({
              y: row.outOfRange,
              // Con un equipo elegido, los demás se atenúan.
              color:
                selectedEquipmentId === null ||
                row.equipmentId === selectedEquipmentId
                  ? colors.alert
                  : colors.previous,
            })),
          },
        ],
      }}
      table={{
        columns: [
          { label: "Equipo" },
          { label: "Fuera de rango", numeric: true },
          { label: "Entregas", numeric: true },
          { label: "% fuera de rango", numeric: true },
          { label: "Colaboradores", numeric: true },
          { label: "Anticipación promedio", numeric: true },
        ],
        rows: rows.map((row) => [
          row.equipmentName,
          formatNumber(row.outOfRange),
          formatNumber(row.deliveries),
          formatPercent((row.outOfRange * 100) / row.deliveries),
          formatNumber(row.employees),
          daysEarly(row.averageDaysEarly),
        ]),
      }}
    />
  );
}
