import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { SecondaryType } from "@interfaces";
import { SecondaryTypesService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: SecondaryType[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<SecondaryType>[] = [
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
    id: "mainType",
    sortKey: "mainType",
    header: "Criterio",
    cell: (row) => row.mainType.name,
    card: "subtitle",
  },
  {
    id: "typeResponsible",
    header: "Responsable",
    cell: (row) => row.typeResponsible,
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

export default function TableSecondaryTypes({ rows, getData, pagination, sorting }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => SecondaryTypesService.remove(id),
    onSuccess: () => {
      notify("Tipo de criterio eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: SecondaryType) => {
    await confirm({
      title: "Eliminar tipo de criterio",
      description: `¿Deseas eliminar el tipo de criterio "${row.name}"?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <CatalogTable
        sorting={sorting}
        catalog="secondary-types"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Tipos de criterios"
        emptyTitle="Sin registros de tipos de criterios"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/secondary-types/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const SECONDARY_TYPE_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "mainType", label: "Criterio", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const SECONDARY_TYPE_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
