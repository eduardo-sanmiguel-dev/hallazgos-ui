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
import { MainType } from "@interfaces";
import { MainTypesService } from "@services";

interface Props {
  rows: MainType[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<MainType>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
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

export default function TableMainTypes({ rows, getData, pagination }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => MainTypesService.remove(id),
    onSuccess: () => {
      notify("Criterio eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: MainType) => {
    await confirm({
      title: "Eliminar criterio",
      description: `¿Deseas eliminar el criterio "${row.name}"?`,
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
        ariaLabel="Criterios"
        emptyTitle="Sin registros de criterios"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/main-types/form?id=" + row.id)}
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
