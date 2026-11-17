import { useMutation } from "@tanstack/react-query";

import { notify } from "@shared/utils";
import { ICSData } from "@interfaces";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import { IcsService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: ICSData[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable). La
// tabla conserva sus columnas de siempre.
const columns: ResponsiveColumn<ICSData>[] = [
  {
    id: "title",
    header: "Registro",
    cell: (row) => `ICS #${row.id} · ${row.icsPercentage}%`,
    card: "title",
    hideInTable: true,
  },
  {
    id: "id",
    sortKey: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "manufacturingPlant",
    sortKey: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
  },
  {
    id: "ruleOfLife",
    sortKey: "ruleOfLife",
    header: "Regla de vida",
    cell: (row) => row.ruleOfLife.name,
  },
  {
    id: "standardOfBehavior",
    sortKey: "standardOfBehavior",
    header: "Estandar de comportamiento",
    cell: (row) => row.standardOfBehavior?.name || "",
  },
  {
    id: "areaOfBehavior",
    sortKey: "areaOfBehavior",
    header: "Área al que aplica",
    cell: (row) => row.areaOfBehavior?.name || "",
  },
  {
    id: "totalPeople",
    sortKey: "totalPeople",
    header: "Personas totales",
    cell: (row) => row.totalPeople,
  },
  {
    id: "totalCorrectPeople",
    sortKey: "totalCorrectPeople",
    header: "Personas cumpliendo el estándar",
    cell: (row) => row.totalCorrectPeople,
    card: "hidden",
  },
  {
    id: "totalIncorrectPeople",
    sortKey: "totalIncorrectPeople",
    header: "Personas no cumpliendo el estándar",
    cell: (row) => row.totalIncorrectPeople,
    card: "hidden",
  },
  {
    id: "people",
    header: "Cumplen / No cumplen",
    cell: (row) => `${row.totalCorrectPeople} / ${row.totalIncorrectPeople}`,
    hideInTable: true,
  },
  {
    id: "icsPercentage",
    sortKey: "icsPercentage",
    header: "Índice de comportamiento seguro (%)",
    cell: (row) => `${row.icsPercentage}%`,
    card: "hidden",
  },
];

export default function TableIcs({ rows, getData, pagination, sorting }: Props) {
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => IcsService.remove(id),
    onSuccess: () => {
      notify("ICS eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: ICSData) => {
    await confirm({
      title: "Eliminar registro de ICS",
      description: `¿Deseas eliminar el registro de ICS #${row.id}?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <ResponsiveTable
        sorting={sorting}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Registros de ICS"
        emptyTitle="Sin registros de ICS"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const ICS_SORT_OPTIONS: SortOption[] = [
  { key: "createdAt", label: "Fecha de registro", kind: "date" },
  { key: "id", label: "ID", kind: "number" },
  { key: "manufacturingPlant", label: "Planta", kind: "text" },
  { key: "ruleOfLife", label: "Regla de vida", kind: "text" },
  { key: "standardOfBehavior", label: "Estándar de comportamiento", kind: "text" },
  { key: "areaOfBehavior", label: "Área al que aplica", kind: "text" },
  { key: "totalPeople", label: "Personas totales", kind: "number" },
  { key: "totalCorrectPeople", label: "Personas cumpliendo el estándar", kind: "number" },
  { key: "totalIncorrectPeople", label: "Personas no cumpliendo el estándar", kind: "number" },
  { key: "icsPercentage", label: "Índice de comportamiento seguro (%)", kind: "number" },
];

export const ICS_DEFAULT_SORT: SortState = { orderBy: "createdAt", order: "desc" };
