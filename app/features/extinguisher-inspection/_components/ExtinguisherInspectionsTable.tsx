import { useMutation } from "@tanstack/react-query";

import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "@shared/navigation";

import { stringToDateWithTime } from "@shared/utils";
import { ExtinguisherInspectionsService } from "@services";
import { ExtinguisherInspection } from "@interfaces";
import { type ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: ExtinguisherInspection[];
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

const inspectionDate = (row: ExtinguisherInspection) =>
  dayjs(row.inspectionDate).isValid()
    ? dayjs(row.inspectionDate).locale("es").format("DD MMMM YYYY")
    : "-";

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<ExtinguisherInspection>[] = [
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
    header: "Inspección",
    cell: (row) => `Inspección #${row.id} · ${inspectionDate(row)}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "plant",
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "responsible",
    sortKey: "responsible",
    header: "Responsable",
    cell: (row) => row.responsible?.name || "-",
  },
  {
    id: "date",
    sortKey: "inspectionDate",
    header: "Fecha inspección",
    cell: inspectionDate,
    card: "hidden",
  },
  {
    id: "evaluations",
    header: "Evaluaciones",
    cell: (row) => row.evaluations?.length || 0,
  },
  {
    id: "createdAt",
    sortKey: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "createdBy",
    sortKey: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
  },
];

export default function ExtinguisherInspectionsTable({ rows, pagination, sorting }: Props) {
  const router = useRouter();
  // Una a la vez: el botón se deshabilita mientras se descarga.
  const download = useMutation({
    mutationFn: (id: number) => ExtinguisherInspectionsService.downloadFile(id),
  });

  return (
    <ResponsiveTable
      sorting={sorting}
      rows={rows}
      columns={columns}
      getRowKey={(row) => row.id}
      pagination={pagination}
      ariaLabel="Inspecciones de extintores"
      emptyDescription="No hay inspecciones con los filtros actuales."
      actions={(row) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Descargar Excel">
            <IconButton
              aria-label={`Descargar Excel de la inspección ${row.id}`}
              sx={{ color: "text.brand" }}
              onClick={() => download.mutate(row.id)}
              disabled={download.isPending}
            >
              <SimCardDownloadIcon />
            </IconButton>
          </Tooltip>

          {dayjs(row.inspectionDate).isSame(dayjs(), "day") && (
            <Tooltip title="Agregar más evaluaciones">
              <IconButton
                aria-label={`Agregar evaluaciones a la inspección ${row.id}`}
                color="secondary"
                onClick={() => router.push(`/extinguisher-inspection/form?id=${row.id}`)}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )}
    />
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const EXTINGUISHER_INSPECTION_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "responsible", label: "Responsable", kind: "text" },
  { key: "inspectionDate", label: "Fecha de inspección", kind: "date" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "createdBy", label: "Creado por", kind: "text" },
];

export const EXTINGUISHER_INSPECTION_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
