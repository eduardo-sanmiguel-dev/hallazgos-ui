import { useMutation } from "@tanstack/react-query";

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
import { GembaWalkObserver } from "@interfaces";
import { GembaWalkObserversService } from "@services";

interface Props {
  rows: GembaWalkObserver[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, G8).
const columns: ResponsiveColumn<GembaWalkObserver>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "userCard",
    header: "Usuario",
    cell: (row) => row.user?.name || "-",
    card: "title",
    hideInTable: true,
  },
  {
    id: "emailCard",
    header: "Correo",
    cell: (row) => row.user?.email || "",
    card: "subtitle",
    hideInTable: true,
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
  },
  {
    id: "nameZone",
    header: "Zona",
    cell: (row) => row.gembaWalkZone?.nameZone || "-",
  },
  {
    id: "nameLocation",
    header: "Ubicación",
    cell: (row) => row.gembaWalkZone?.nameLocation || "-",
  },
  {
    id: "user",
    header: "Usuario",
    cell: (row) => (row.user ? `${row.user.name} - ${row.user.email}` : "-"),
    card: "hidden",
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

export default function TableGembaWalkObservers({
  rows,
  getData,
  pagination,
}: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => GembaWalkObserversService.remove(id),
    onSuccess: () => {
      notify("Observador eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

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
      <ResponsiveTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Observadores de Gemba Walk"
        emptyTitle="Sin registros de observadores"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() =>
                router.push("/gemba-walk/observers/form?id=" + row.id)
              }
            />
            <DeleteAction
              onClick={() => confirmRemove(row)}
              disabled={removeMutation.isPending}
            />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}
