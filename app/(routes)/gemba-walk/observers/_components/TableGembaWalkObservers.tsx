import { useState } from "react";

import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";

import { notify, stringToDateWithTime } from "@shared/utils";
import TableDefault, {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { GembaWalkObserver } from "@interfaces";
import { GembaWalkObserversService } from "@services";

interface Props {
  rows: GembaWalkObserver[];
  getData: () => void;
}

const columns = [
  "ID",
  "Planta",
  "Zona",
  "Ubicación",
  "Usuario",
  "Creado por",
  "Actualizado por",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableGembaWalkObservers({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const remove = (id: number) => {
    setIsLoading(true);
    GembaWalkObserversService.remove(id)
      .then(() => {
        notify("Observador eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = (row: GembaWalkObserver) => {
    toast.warning("Confirmar eliminación", {
      description: `¿Desea eliminar al observador #${row.id} (${row.user?.name})?`,
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
      paintRows={(row: GembaWalkObserver) => (
        <StyledTableRow key={row.id}>
          <StyledTableCell component="th" scope="row">
            {row.id}
          </StyledTableCell>
          <StyledTableCell>
            {row.manufacturingPlant?.name || "-"}
          </StyledTableCell>
          <StyledTableCell>
            {row.gembaWalkZone?.nameZone || "-"}
          </StyledTableCell>
          <StyledTableCell>
            {row.gembaWalkZone?.nameLocation || "-"}
          </StyledTableCell>
          <StyledTableCell>
            {row.user ? `${row.user.name} - ${row.user.email}` : "-"}
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
                  router.push("/gemba-walk/observers/form?id=" + row.id)
                }
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
