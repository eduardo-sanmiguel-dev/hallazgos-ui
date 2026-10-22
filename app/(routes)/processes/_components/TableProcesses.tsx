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
import { Processes } from "@interfaces";
import { ProcessesService } from "@services";

interface Props {
  rows: Processes[];
  getData: () => void;
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Nombre",
  "Planta",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableProcess({ rows, getData, pagination }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return ProcessesService.remove(id)
      .then(() => {
        notify("Proceso eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: Processes) => {
    await confirm({
      title: "Eliminar proceso",
      description: `¿Deseas eliminar el proceso "${row.name}"?`,
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
        paintRows={(row: Processes) => (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>{row.name}</StyledTableCell>
            <StyledTableCell>{row.manufacturingPlant.name}</StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.createdAt)}
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.updatedAt)}
            </StyledTableCell>
            <StyledTableCell>
              <RowActions>
                <EditAction
                  onClick={() => router.push("/processes/form?id=" + row.id)}
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
