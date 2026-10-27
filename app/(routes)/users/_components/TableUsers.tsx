import { useState } from "react";

import { useRouter } from "next/navigation";

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
import { User } from "@interfaces";
import { UsersService } from "@services";

interface Props {
  rows: User[];
  getData: () => void;
  pagination: ServerPagination;
}

// En celular cada usuario es una tarjeta: nombre, correo y lo demás como
// etiqueta: valor (antes la tabla partía nombres y correos en 2-3 líneas).
const columns: ResponsiveColumn<User>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "email",
    header: "Correo electrónico",
    cell: (row) => row.email,
    card: "subtitle",
  },
  {
    id: "plants",
    header: "Plantas",
    cell: (row) => row.manufacturingPlants.map(({ name }) => name).join(", "),
  },
  { id: "role", header: "Role", cell: (row) => row.role },
  {
    id: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "updatedAt",
    header: "Ultima actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
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
      <ResponsiveTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Usuarios"
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/users/form?id=" + row.id)}
            />
            <DeleteAction
              onClick={() => confirmRemove(row)}
              disabled={isLoading}
            />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}
