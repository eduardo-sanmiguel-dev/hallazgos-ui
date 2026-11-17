import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { GembaWalkZone } from "@interfaces";
import { GembaWalkZonesService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: GembaWalkZone[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, G8).
const columns: ResponsiveColumn<GembaWalkZone>[] = [
  {
    id: "id",
    sortKey: "id",
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
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "nameZone",
    sortKey: "nameZone",
    header: "Zona",
    cell: (row) => row.nameZone,
    card: "hidden",
  },
  {
    id: "nameLocation",
    sortKey: "nameLocation",
    header: "Ubicación",
    cell: (row) => row.nameLocation,
    card: "hidden",
  },
  {
    id: "createdBy",
    sortKey: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
    card: "hidden",
  },
  {
    id: "updatedBy",
    sortKey: "updatedBy",
    header: "Actualizado por",
    cell: (row) => row.updatedBy?.name || "-",
    card: "hidden",
  },
  {
    id: "createdAt",
    sortKey: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
    card: "hidden",
  },
  {
    id: "updatedAt",
    sortKey: "updatedAt",
    header: "Última actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
];

export default function TableGembaWalkZones({ rows, getData, pagination, sorting }: Props) {
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
      <CatalogTable
        sorting={sorting}
        catalog="gemba-walk-zones"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Zonas de Gemba Walk"
        emptyTitle="Sin registros de zonas"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/gemba-walk/zones/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const GEMBA_WALK_ZONE_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "nameZone", label: "Zona", kind: "text" },
  { key: "nameLocation", label: "Ubicación", kind: "text" },
  { key: "createdBy", label: "Creado por", kind: "text" },
  { key: "updatedBy", label: "Actualizado por", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const GEMBA_WALK_ZONE_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
