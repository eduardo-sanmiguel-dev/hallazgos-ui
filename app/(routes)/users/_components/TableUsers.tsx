import { useState } from "react";

import { useRouter } from "next/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
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
import { User } from "@interfaces";
import { UsersService } from "@services";

interface Props {
  rows: User[];
  getData: () => void;
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Nombre",
  "Correo electrónico",
  "Plantas",
  "Role",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableUsers({ rows, getData, pagination }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return UsersService.remove(id)
      .then(() => {
        notify("Usuario eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: User) => {
    await confirm({
      title: "Eliminar usuario",
      description: `¿Deseas eliminar al usuario "${row.name}"?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  // Zonas y procesos no van en la tabla (no cabían y la API ya no los manda
  // en el listado); se ven al editar el usuario.
  return (
    <>
      <TableDefaultServer
        rows={rows}
        columns={columns}
        {...pagination}
        paintRows={(row: User) => {
          return (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.name}</StyledTableCell>
              <StyledTableCell>{row.email}</StyledTableCell>
              <StyledTableCell>
                {row.manufacturingPlants.map(({ name }) => name).join(", ")}
              </StyledTableCell>
              <StyledTableCell>{row.role}</StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(row.createdAt)}
              </StyledTableCell>
              <StyledTableCell>
                {updatedDateLabel(row.createdAt, row.updatedAt) ?? "-"}
              </StyledTableCell>
              <StyledTableCell>
                <RowActions>
                  <EditAction
                    onClick={() => router.push("/users/form?id=" + row.id)}
                  />
                  <DeleteAction
                    onClick={() => confirmRemove(row)}
                    disabled={isLoading}
                  />
                </RowActions>
              </StyledTableCell>
            </StyledTableRow>
          );
        }}
      />
      {confirmDialog}
    </>
  );
}
