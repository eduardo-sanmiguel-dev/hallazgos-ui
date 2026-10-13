import { useState } from "react";

import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";
import moment from "moment-timezone";

import { notify, stringToDateWithTime } from "@shared/utils";
import TableDefault, {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { GembaWalkCalendar } from "@interfaces";
import { GembaWalkCalendarService } from "@services";

interface Props {
  rows: GembaWalkCalendar[];
  getData: () => void;
}

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

export default function TableGembaWalkCalendar({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const remove = (id: number) => {
    setIsLoading(true);
    GembaWalkCalendarService.remove(id)
      .then(() => {
        notify("Evento eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = (row: GembaWalkCalendar) => {
    toast.warning("Confirmar eliminación", {
      description: `¿Desea eliminar el evento #${row.id} (${row.gembaWalkZone?.nameZone} - ${stringToDateWithTime(row.scheduledAt)})?`,
      duration: 10000,
      cancel: {
        label: "Cancelar",
        onClick: () => undefined,
      },
      action: {
        label: "Eliminar",
        onClick: () => remove(row.id),
      },
    });
  };

  return (
    <TableDefault
      rows={rows}
      columns={columns}
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
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<EditIcon />}
                label="Editar"
                color="warning"
                onClick={() =>
                  router.push(
                    `/gemba-walk/calendar/form?manufacturingPlantId=${row.gembaWalkZone?.manufacturingPlant?.id}&date=${moment(row.scheduledAt).format("YYYY-MM-DD")}`,
                  )
                }
                disabled={new Date(row.scheduledAt).getTime() <= Date.now()}
              />
              <Chip
                icon={<DeleteIcon />}
                label="Eliminar"
                color="error"
                onClick={() => confirmRemove(row)}
                disabled={isLoading}
              />
            </Stack>
          </StyledTableCell>
        </StyledTableRow>
      )}
    />
  );
}
