import { useState } from "react";

import { useRouter } from "next/navigation";

import { Chip, Typography } from "@mui/material";
import { toast } from "sonner";
import dayjs from "@shared/libs/dayjs";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { GembaWalkCalendar } from "@interfaces";
import { GembaWalkCalendarService } from "@services";

interface Props {
  rows: GembaWalkCalendar[];
  getData: () => void;
  pagination: ServerPagination;
}

// Los eventos cuya fecha y hora ya pasó no se editan ni se eliminan.
const isPast = (scheduledAt: string | Date) =>
  new Date(scheduledAt).getTime() <= Date.now();

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, G8).
const columns: ResponsiveColumn<GembaWalkCalendar>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "title",
    header: "Zona y ubicación",
    cell: (row) =>
      `${row.gembaWalkZone?.nameZone || "-"} - ${row.gembaWalkZone?.nameLocation || "-"}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.gembaWalkZone?.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "nameZone",
    header: "Zona",
    cell: (row) => row.gembaWalkZone?.nameZone || "-",
    card: "hidden",
  },
  {
    id: "nameLocation",
    header: "Ubicación",
    cell: (row) => row.gembaWalkZone?.nameLocation || "-",
    card: "hidden",
  },
  {
    id: "scheduledAt",
    header: "Fecha y hora",
    cell: (row) => stringToDateWithTime(row.scheduledAt),
  },
  {
    id: "isAdditional",
    header: "Adicional",
    cell: (row) => (
      <Chip
        size="small"
        label={row.isAdditional ? "Sí" : "No"}
        color={row.isAdditional ? "info" : "default"}
      />
    ),
  },
  {
    id: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
    card: "hidden",
  },
  {
    id: "updatedBy",
    header: "Actualizado por",
    cell: (row) => row.updatedBy?.name || "-",
    card: "hidden",
  },
  {
    id: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
    card: "hidden",
  },
  {
    id: "updatedAt",
    header: "Última actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
];

export default function TableGembaWalkCalendar({
  rows,
  getData,
  pagination,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (row: GembaWalkCalendar) => {
    // La confirmación puede quedar abierta hasta que el evento pase.
    if (isPast(row.scheduledAt)) {
      toast.error("No se pueden eliminar eventos pasados");
      return;
    }

    setIsLoading(true);
    return GembaWalkCalendarService.remove(row.id)
      .then(() => {
        notify("Evento eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: GembaWalkCalendar) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el evento #${row.id} (${row.gembaWalkZone?.nameZone} - ${stringToDateWithTime(row.scheduledAt)})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row),
    });
  };

  return (
    <>
      <ResponsiveTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Calendario de Gemba Walk"
        emptyTitle="Sin registros de eventos"
        emptyDescription="No hay registros con los filtros actuales."
        // Los eventos pasados no se editan ni se eliminan (el API también lo
        // valida); antes, la celda mostraba "-".
        actions={(row) =>
          isPast(row.scheduledAt) ? (
            <Typography variant="body2" color="text.secondary">
              Evento pasado
            </Typography>
          ) : (
            <RowActions>
              <EditAction
                onClick={() =>
                  router.push(
                    `/gemba-walk/calendar/form?manufacturingPlantId=${row.gembaWalkZone?.manufacturingPlant?.id}&date=${dayjs(row.scheduledAt).format("YYYY-MM-DD")}`,
                  )
                }
              />
              <DeleteAction
                onClick={() => confirmRemove(row)}
                disabled={isLoading}
              />
            </RowActions>
          )
        }
      />
      {confirmDialog}
    </>
  );
}
