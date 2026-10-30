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
import { Processes } from "@interfaces";
import { ProcessesService } from "@services";

interface Props {
  rows: Processes[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Processes>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
  },
  {
    id: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "updatedAt",
    header: "Última actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
];

export default function TableProcess({ rows, getData, pagination }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => ProcessesService.remove(id),
    onSuccess: () => {
      notify("Proceso eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

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
      <ResponsiveTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Procesos"
        emptyTitle="Sin registros de procesos"
        emptyDescription="No hay procesos con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/processes/form?id=" + row.id)}
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
