import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import { Ciael } from "@interfaces";
import { stringToDate, stringToDateWithTime } from "@shared/utils";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  data: Ciael[];
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

const zoneWithArea = (ciael: Ciael) =>
  [ciael.zone.name, ciael.zone.area?.name].filter(Boolean).join(" · ");

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Ciael>[] = [
  {
    id: "title",
    header: "Evento",
    cell: (ciael) => `${ciael.typeOfEvent.name} · ${stringToDate(ciael.eventDate)}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "typeOfEvent",
    sortKey: "typeOfEvent",
    header: "Tipo de evento",
    cell: (ciael) => ciael.typeOfEvent.name,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "employee",
    sortKey: "employee",
    header: "Colaborador",
    cell: (ciael) => ciael.employee.name,
    card: "subtitle",
  },
  {
    id: "eventDate",
    sortKey: "eventDate",
    header: "Fecha de evento",
    cell: (ciael) => stringToDate(ciael.eventDate),
    card: "hidden",
  },
  {
    id: "cieDiagnosis",
    sortKey: "cieDiagnosis",
    header: "Diagnóstico CIE",
    cell: (ciael) => ciael.cieDiagnosis.name,
  },
  {
    id: "area",
    sortKey: "area",
    header: "Área",
    cell: (ciael) => ciael.zone.area?.name,
    card: "hidden",
  },
  {
    id: "zone",
    sortKey: "zone",
    header: "Zona",
    cell: (ciael) => ciael.zone.name,
    card: "hidden",
  },
  {
    id: "zoneWithArea",
    header: "Zona",
    cell: zoneWithArea,
    hideInTable: true,
  },
  {
    id: "createdAt",
    sortKey: "createdAt",
    header: "Fecha de creación",
    cell: (ciael) => stringToDateWithTime(ciael.createdAt),
  },
  {
    id: "createdBy",
    sortKey: "createdBy",
    header: "Usuario que reportó",
    cell: (ciael) => ciael.createdBy.name,
  },
];

export default function TableCiaels({ data, pagination, sorting }: Props) {
  return (
    <ResponsiveTable
      sorting={sorting}
      rows={data}
      columns={columns}
      getRowKey={(ciael) => ciael.id}
      pagination={pagination}
      ariaLabel="Registros CIAEL"
      emptyTitle="Sin registros CIAEL"
      emptyDescription="No hay registros con los filtros actuales."
    />
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const CIAEL_SORT_OPTIONS: SortOption[] = [
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "eventDate", label: "Fecha de evento", kind: "date" },
  { key: "typeOfEvent", label: "Tipo de evento", kind: "text" },
  { key: "employee", label: "Colaborador", kind: "text" },
  { key: "cieDiagnosis", label: "Diagnóstico CIE", kind: "text" },
  { key: "area", label: "Área", kind: "text" },
  { key: "zone", label: "Zona", kind: "text" },
  { key: "createdBy", label: "Usuario que reportó", kind: "text" },
  { key: "id", label: "ID", kind: "number" },
];

export const CIAEL_DEFAULT_SORT: SortState = { orderBy: "createdAt", order: "desc" };
