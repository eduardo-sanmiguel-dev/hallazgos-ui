import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { Area } from "@interfaces";
import { AreasService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: Area[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Area>[] = [
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
    id: "manufacturingPlant",
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
    card: "subtitle",
  },
  {
    id: "createdBy",
    sortKey: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy?.name || "-",
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

export default function TableAreas({ rows, getData, pagination, sorting }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => AreasService.remove(id),
    onSuccess: () => {
      notify("Zona eliminada correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: Area) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar la zona #${row.id} (${row.name})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <CatalogTable
        sorting={sorting}
        catalog="areas"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Zonas"
        emptyTitle="Sin registros de zonas"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/areas/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const AREA_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "createdBy", label: "Creado por", kind: "text" },
  { key: "updatedBy", label: "Actualizado por", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const AREA_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
