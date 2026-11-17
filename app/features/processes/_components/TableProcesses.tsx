import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { Processes } from "@interfaces";
import { ProcessesService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: Processes[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Processes>[] = [
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
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
  },
  {
    id: "createdAt",
    sortKey: "createdAt",
    header: "Creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
  },
  {
    id: "updatedAt",
    sortKey: "updatedAt",
    header: "Última actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
];

export default function TableProcess({ rows, getData, pagination, sorting }: Props) {
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
      <CatalogTable
        sorting={sorting}
        catalog="processes"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Procesos"
        emptyTitle="Sin registros de procesos"
        emptyDescription="No hay procesos con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/processes/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const PROCESS_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const PROCESS_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
