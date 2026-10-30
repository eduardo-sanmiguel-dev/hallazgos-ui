import { useMutation } from "@tanstack/react-query";

import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "next/navigation";

import { stringToDateWithTime } from "@shared/utils";
import { ExtinguisherInspectionsService } from "@services";
import { ExtinguisherInspection } from "@interfaces";
import { type ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";

interface Props {
  rows: ExtinguisherInspection[];
  pagination: ServerPagination;
}

const inspectionDate = (row: ExtinguisherInspection) =>
  dayjs(row.inspectionDate).isValid()
    ? dayjs(row.inspectionDate).locale("es").format("DD MMMM YYYY")
    : "-";

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<ExtinguisherInspection>[] = [
  {
    id: "id",
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
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "responsible",
    header: "Responsable",
    cell: (row) => row.responsible?.name || "-",
  },
  {
    id: "date",
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
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
  },
];

export default function ExtinguisherInspectionsTable({
  rows,
  pagination,
}: Props) {
  const router = useRouter();
  // Una a la vez: el botón se deshabilita mientras se descarga.
  const download = useMutation({
    mutationFn: (id: number) => ExtinguisherInspectionsService.downloadFile(id),
  });

  return (
    <ResponsiveTable
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
                onClick={() =>
                  router.push(`/extinguisher-inspection/form?id=${row.id}`)
                }
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
