import { useState } from "react";

import { useRouter } from "next/navigation";

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
import TableDefaultServer, {
  type ServerPagination,
} from "@shared/components/TableDefaultServer";
import { GembaWalkObserver } from "@interfaces";
import { GembaWalkObserversService } from "@services";

interface Props {
  rows: GembaWalkObserver[];
  getData: () => void;
  pagination: ServerPagination;
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

export default function TableGembaWalkObservers({
  rows,
  getData,
  pagination,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return GembaWalkObserversService.remove(id)
      .then(() => {
        notify("Observador eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: GembaWalkObserver) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar al observador #${row.id} (${row.user?.name})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <TableDefaultServer
        rows={rows}
        columns={columns}
        {...pagination}
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
              <RowActions>
                <EditAction
                  onClick={() =>
                    router.push("/gemba-walk/observers/form?id=" + row.id)
                  }
                />
                <DeleteAction
                  onClick={() => confirmRemove(row)}
                  disabled={isLoading}
                />
              </RowActions>
            </StyledTableCell>
          </StyledTableRow>
        )}
      />
      {confirmDialog}
    </>
  );
}
