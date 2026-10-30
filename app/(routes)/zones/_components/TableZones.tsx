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
import { Zone } from "@interfaces";
import { ZonesService } from "@services";

interface Props {
  rows: Zone[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Zone>[] = [
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
  { id: "area", header: "Zona", cell: (row) => row.area?.name || "-" },
  {
    id: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
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

export default function TableZones({ rows, getData, pagination }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => ZonesService.remove(id),
    onSuccess: () => {
      notify("Lugar eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: Zone) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el lugar #${row.id} (${row.name})?`,
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
        ariaLabel="Lugares"
        emptyTitle="Sin registros de lugares"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/zones/form?id=" + row.id)}
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
