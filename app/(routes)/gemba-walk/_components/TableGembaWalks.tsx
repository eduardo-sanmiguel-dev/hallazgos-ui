import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";

import { stringToDateWithTime } from "@shared/utils";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import { type ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { GembaWalk } from "@interfaces";
import { formatDuration } from "./formatDuration";

interface Props {
  rows: GembaWalk[];
  pagination: ServerPagination;
}

export const complianceOf = (gembaWalk: GembaWalk) => {
  const total = gembaWalk.results?.length || 0;
  const compliant =
    gembaWalk.results?.filter(({ isCompliant }) => isCompliant).length || 0;

  return {
    total,
    compliant,
    nonCompliant: total - compliant,
    percent: total ? Math.round((compliant / total) * 100) : 0,
  };
};

const zoneOf = (row: GembaWalk) => row.gembaWalkCalendar?.gembaWalkZone;

const ComplianceChips = ({ row }: { row: GembaWalk }) => {
  const { compliant, nonCompliant } = complianceOf(row);

  return (
    <Stack direction="row" spacing={1}>
      <Chip size="small" color="success" label={`C: ${compliant}`} />
      <Chip
        size="small"
        color={nonCompliant ? "error" : "default"}
        label={`NC: ${nonCompliant}`}
      />
    </Stack>
  );
};

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable), donde
// el resultado y "Ver" quedaban fuera de la pantalla (G2).
const columns: ResponsiveColumn<GembaWalk>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "title",
    header: "Recorrido",
    cell: (row) =>
      `${zoneOf(row)?.nameZone || "-"} - ${zoneOf(row)?.nameLocation || "-"}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "plant",
    header: "Planta",
    cell: (row) => zoneOf(row)?.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "zone",
    header: "Zona",
    cell: (row) => zoneOf(row)?.nameZone || "-",
    card: "hidden",
  },
  {
    id: "location",
    header: "Ubicación",
    cell: (row) => zoneOf(row)?.nameLocation || "-",
    card: "hidden",
  },
  {
    id: "scheduledAt",
    header: "Programado",
    cell: (row) => `${stringToDateWithTime(row.gembaWalkCalendar.scheduledAt)}`,
  },
  {
    id: "isAdditional",
    header: "Adicional",
    cell: (row) => (row.gembaWalkCalendar.isAdditional ? "Sí" : "No"),
  },
  {
    id: "performedAt",
    header: "Realizado",
    cell: (row) => stringToDateWithTime(row.performedAt),
  },
  {
    id: "duration",
    header: "Duración",
    cell: (row) => formatDuration(row.durationSeconds),
  },
  {
    id: "result",
    header: "Resultado",
    cell: (row) => <ComplianceChips row={row} />,
  },
  {
    id: "percent",
    header: "Cumplimiento",
    cell: (row) => `${complianceOf(row).percent}%`,
  },
  {
    id: "createdBy",
    header: "Observador",
    cell: (row) => row.createdBy?.name || "-",
  },
];

export default function TableGembaWalks({ rows, pagination }: Props) {
  const router = useRouter();

  return (
    <ResponsiveTable
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      pagination={pagination}
      ariaLabel="Recorridos"
      emptyDescription="No hay recorridos con los filtros actuales."
      actions={(row) => (
        <RowActions>
          <ViewAction
            onClick={() => router.push("/gemba-walk/view?id=" + row.id)}
          />
        </RowActions>
      )}
    />
  );
}
