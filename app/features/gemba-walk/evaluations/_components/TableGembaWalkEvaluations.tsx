import { useMutation } from "@tanstack/react-query";

import { useRouter } from "@shared/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { GembaWalkEvaluation } from "@interfaces";
import { GembaWalkEvaluationsService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: GembaWalkEvaluation[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, G8).
const columns: ResponsiveColumn<GembaWalkEvaluation>[] = [
  {
    id: "id",
    sortKey: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "area", sortKey: "area", header: "Área", cell: (row) => row.area, card: "title" },
  {
    id: "category",
    sortKey: "category",
    header: "Categoría",
    cell: (row) => row.category,
    card: "subtitle",
  },
  {
    id: "manufacturingPlant",
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant?.name || "-",
  },
  {
    id: "description",
    sortKey: "description",
    header: "Descripción",
    cell: (row) => row.description,
    cellSx: { minWidth: 320, whiteSpace: "pre-line" },
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

export default function TableGembaWalkEvaluations({ rows, getData, pagination, sorting }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => GembaWalkEvaluationsService.remove(id),
    onSuccess: () => {
      notify("Concepto eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: GembaWalkEvaluation) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el concepto #${row.id} (${row.category} - ${row.area})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <CatalogTable
        sorting={sorting}
        catalog="gemba-walk-evaluations"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Conceptos de evaluación"
        emptyTitle="Sin registros de conceptos"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/gemba-walk/evaluations/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const GEMBA_WALK_EVALUATION_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "area", label: "Área", kind: "text" },
  { key: "category", label: "Categoría", kind: "text" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "description", label: "Descripción", kind: "text" },
  { key: "createdBy", label: "Creado por", kind: "text" },
  { key: "updatedBy", label: "Actualizado por", kind: "text" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const GEMBA_WALK_EVALUATION_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
