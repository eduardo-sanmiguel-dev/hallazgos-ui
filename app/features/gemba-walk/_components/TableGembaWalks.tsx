import { useRouter } from "@shared/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";

import { stringToDateWithTime } from "@shared/utils";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import { type ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import { GembaWalk } from "@interfaces";
import { formatDuration } from "./formatDuration";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: GembaWalk[];
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

export const complianceOf = (gembaWalk: GembaWalk) => {
  const total = gembaWalk.results?.length || 0;
  const compliant = gembaWalk.results?.filter(({ isCompliant }) => isCompliant).length || 0;

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
      <Chip size="small" color={nonCompliant ? "error" : "default"} label={`NC: ${nonCompliant}`} />
    </Stack>
  );
};

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable), donde
// el resultado y "Ver" quedaban fuera de la pantalla (G2).
const columns: ResponsiveColumn<GembaWalk>[] = [
  {
    id: "id",
    sortKey: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "title",
    header: "Recorrido",
    cell: (row) => `${zoneOf(row)?.nameZone || "-"} - ${zoneOf(row)?.nameLocation || "-"}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "plant",
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => zoneOf(row)?.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "zone",
    sortKey: "nameZone",
    header: "Zona",
    cell: (row) => zoneOf(row)?.nameZone || "-",
    card: "hidden",
  },
  {
    id: "location",
    sortKey: "nameLocation",
    header: "Ubicación",
    cell: (row) => zoneOf(row)?.nameLocation || "-",
    card: "hidden",
  },
  {
    id: "scheduledAt",
    sortKey: "scheduledAt",
    header: "Programado",
    cell: (row) => `${stringToDateWithTime(row.gembaWalkCalendar.scheduledAt)}`,
  },
  {
    id: "isAdditional",
    sortKey: "isAdditional",
    header: "Adicional",
    cell: (row) => (row.gembaWalkCalendar.isAdditional ? "Sí" : "No"),
  },
  {
    id: "performedAt",
    sortKey: "performedAt",
    header: "Realizado",
    cell: (row) => stringToDateWithTime(row.performedAt),
  },
  {
    id: "duration",
    sortKey: "duration",
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
    sortKey: "createdBy",
    header: "Observador",
    cell: (row) => row.createdBy?.name || "-",
  },
];

export default function TableGembaWalks({ rows, pagination, sorting }: Props) {
  const router = useRouter();

  return (
    <ResponsiveTable
      sorting={sorting}
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      pagination={pagination}
      ariaLabel="Recorridos"
      emptyDescription="No hay recorridos con los filtros actuales."
      actions={(row) => (
        <RowActions>
          <ViewAction onClick={() => router.push("/gemba-walk/view?id=" + row.id)} />
        </RowActions>
      )}
    />
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const GEMBA_WALK_SORT_OPTIONS: SortOption[] = [
  { key: "performedAt", label: "Fecha de realización", kind: "date" },
  { key: "scheduledAt", label: "Fecha programada", kind: "date" },
  { key: "id", label: "ID", kind: "number" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "nameZone", label: "Zona", kind: "text" },
  { key: "nameLocation", label: "Ubicación", kind: "text" },
  { key: "isAdditional", label: "Adicional", kind: "boolean" },
  { key: "duration", label: "Duración", kind: "number" },
  { key: "createdBy", label: "Observador", kind: "text" },
];

export const GEMBA_WALK_DEFAULT_SORT: SortState = { orderBy: "performedAt", order: "desc" };
