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
import { GembaWalkZone } from "@interfaces";
import { GembaWalkZonesService } from "@services";

interface Props {
  rows: GembaWalkZone[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, G8).
const columns: ResponsiveColumn<GembaWalkZone>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "title",
    header: "Zona y ubicación",
    cell: (row) => `${row.nameZone} - ${row.nameLocation}`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "nameZone",
    header: "Zona",
    cell: (row) => row.nameZone,
    card: "hidden",
  },
  {
    id: "nameLocation",
    header: "Ubicación",
    cell: (row) => row.nameLocation,
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

export default function TableGembaWalkZones({
  rows,
  getData,
  pagination,
}: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => GembaWalkZonesService.remove(id),
    onSuccess: () => {
      notify("Zona eliminada correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: GembaWalkZone) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar la zona #${row.id} (${row.nameZone} - ${row.nameLocation})?`,
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
        ariaLabel="Zonas de Gemba Walk"
        emptyTitle="Sin registros de zonas"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/gemba-walk/zones/form?id=" + row.id)}
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
