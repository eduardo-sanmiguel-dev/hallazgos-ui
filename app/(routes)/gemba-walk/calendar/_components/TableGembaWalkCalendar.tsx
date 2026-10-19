import { Dispatch, SetStateAction, useState } from "react";

import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { toast } from "sonner";
import moment from "moment-timezone";

import { notify, stringToDateWithTime } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer from "@shared/components/TableDefaultServer";
import { GembaWalkCalendar } from "@interfaces";
import { GembaWalkCalendarService } from "@services";

interface Props {
  rows: GembaWalkCalendar[];
  getData: () => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  count: number;
}

// Los eventos cuya fecha y hora ya pasó no se editan ni se eliminan.
const isPast = (scheduledAt: string | Date) =>
  new Date(scheduledAt).getTime() <= Date.now();

const columns = [
  "ID",
  "Planta",
  "Zona",
  "Ubicación",
  "Fecha y hora",
  "Adicional",
  "Creado por",
  "Actualizado por",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableGembaWalkCalendar({
  rows,
  getData,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  count,
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
    GembaWalkCalendarService.remove(row.id)
      .then(() => {
        notify("Evento eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: GembaWalkCalendar) => {
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el evento #${row.id} (${row.gembaWalkZone?.nameZone} - ${stringToDateWithTime(row.scheduledAt)})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });

    if (confirmed) remove(row);
  };

  return (
    <>
      <TableDefaultServer
        rows={rows}
        columns={columns}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        count={count}
        paintRows={(row: GembaWalkCalendar) => (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>
              {row.gembaWalkZone?.manufacturingPlant?.name || "-"}
            </StyledTableCell>
            <StyledTableCell>
              {row.gembaWalkZone?.nameZone || "-"}
            </StyledTableCell>
            <StyledTableCell>
              {row.gembaWalkZone?.nameLocation || "-"}
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.scheduledAt)}
            </StyledTableCell>
            <StyledTableCell>
              <Chip
                size="small"
                label={row.isAdditional ? "Sí" : "No"}
                color={row.isAdditional ? "info" : "default"}
              />
            </StyledTableCell>
            <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
            <StyledTableCell>{row.updatedBy?.name || "-"}</StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.createdAt)}
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.updatedAt)}
            </StyledTableCell>
            <StyledTableCell>
              {isPast(row.scheduledAt) ? (
                "-"
              ) : (
                <RowActions>
                  <EditAction
                    onClick={() =>
                      router.push(
                        `/gemba-walk/calendar/form?manufacturingPlantId=${row.gembaWalkZone?.manufacturingPlant?.id}&date=${moment(row.scheduledAt).format("YYYY-MM-DD")}`,
                      )
                    }
                  />
                  <DeleteAction
                    onClick={() => confirmRemove(row)}
                    disabled={isLoading}
                  />
                </RowActions>
              )}
            </StyledTableCell>
          </StyledTableRow>
        )}
      />
      {confirmDialog}
    </>
  );
}
