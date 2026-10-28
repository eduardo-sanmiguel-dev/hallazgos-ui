import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { Ciael } from "@interfaces";
import { stringToDate, stringToDateWithTime } from "@shared/utils";

interface Props {
  data: Ciael[];
  pagination: ServerPagination;
}

const zoneWithArea = (ciael: Ciael) =>
  [ciael.zone.name, ciael.zone.area?.name].filter(Boolean).join(" · ");

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Ciael>[] = [
  {
    id: "title",
    header: "Evento",
    cell: (ciael) =>
      `${ciael.typeOfEvent.name} · ${stringToDate(ciael.eventDate)}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "typeOfEvent",
    header: "Tipo de evento",
    cell: (ciael) => ciael.typeOfEvent.name,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "employee",
    header: "Colaborador",
    cell: (ciael) => ciael.employee.name,
    card: "subtitle",
  },
  {
    id: "eventDate",
    header: "Fecha de evento",
    cell: (ciael) => stringToDate(ciael.eventDate),
    card: "hidden",
  },
  {
    id: "cieDiagnosis",
    header: "Diagnóstico CIE",
    cell: (ciael) => ciael.cieDiagnosis.name,
  },
  {
    id: "area",
    header: "Área",
    cell: (ciael) => ciael.zone.area?.name,
    card: "hidden",
  },
  {
    id: "zone",
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
    header: "Fecha de creación",
    cell: (ciael) => stringToDateWithTime(ciael.createdAt),
  },
  {
    id: "createdBy",
    header: "Usuario que reportó",
    cell: (ciael) => ciael.createdBy.name,
  },
];

export default function TableCiaels({ data, pagination }: Props) {
  return (
    <ResponsiveTable
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
