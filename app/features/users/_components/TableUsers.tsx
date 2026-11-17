import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { User } from "@interfaces";
import { UsersService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: User[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// En celular cada usuario es una tarjeta: nombre, correo y lo demás como
// etiqueta: valor (antes la tabla partía nombres y correos en 2-3 líneas).
const columns: ResponsiveColumn<User>[] = [
  {
    id: "id",
    sortKey: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", sortKey: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "email",
    sortKey: "email",
    header: "Correo electrónico",
    cell: (row) => row.email,
    card: "subtitle",
  },
  {
    id: "plants",
    header: "Plantas",
    cell: (row) => row.manufacturingPlants.map(({ name }) => name).join(", "),
  },
  { id: "role", sortKey: "role", header: "Role", cell: (row) => row.role },
  {
    id: "createdAt",
    sortKey: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "updatedAt",
    sortKey: "updatedAt",
    header: "Ultima actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
];

export default function TableUsers({ rows, getData, pagination, sorting }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => UsersService.remove(id),
    onSuccess: () => {
      notify("Usuario eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

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
      <CatalogTable
        sorting={sorting}
        catalog="users"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Usuarios"
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/users/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const USER_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "email", label: "Correo electrónico", kind: "text" },
  { key: "role", label: "Rol", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const USER_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
