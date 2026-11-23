import { useMutation } from "@tanstack/react-query";
import { safeExternalUrl } from "@shared/utils/escapeHtml";

import { useRouter } from "@shared/navigation";

import { Link } from "@mui/material";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { ManufacturingPlant } from "@interfaces";
import { ManufacturingPlantsService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: ManufacturingPlant[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable). En la
// tarjeta, el link (largo) se cambia por "Abrir mapa".
const columns: ResponsiveColumn<ManufacturingPlant>[] = [
  {
    id: "id",
    sortKey: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", sortKey: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  { id: "lat", sortKey: "lat", header: "Latitud", cell: (row) => row.lat },
  { id: "lng", sortKey: "lng", header: "Longitud", cell: (row) => row.lng },
  {
    id: "link",
    header: "Link",
    // Solo http(s): un enlace con otro esquema se muestra como texto.
    cell: (row) => {
      const href = safeExternalUrl(row.link);
      return href ? (
        <Link href={href} target="_blank" rel="noopener noreferrer">
          {row.link}
        </Link>
      ) : (
        row.link
      );
    },
    card: "hidden",
  },
  {
    id: "map",
    header: "Mapa",
    cell: (row) => {
      const href = safeExternalUrl(row.link);
      return href ? (
        <Link href={href} target="_blank" rel="noopener noreferrer">
          Abrir mapa
        </Link>
      ) : (
        "—"
      );
    },
    hideInTable: true,
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

export default function TableManufacturingPlants({ rows, getData, pagination, sorting }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => ManufacturingPlantsService.remove(id),
    onSuccess: () => {
      notify("Planta eliminada correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: ManufacturingPlant) => {
    await confirm({
      title: "Eliminar planta",
      description: `¿Deseas eliminar la planta "${row.name}"?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  return (
    <>
      <CatalogTable
        sorting={sorting}
        catalog="manufacturing-plants"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Plantas"
        emptyTitle="Sin registros de plantas"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/manufacturing-plants/form?id=" + row.id)} />
            <DeleteAction onClick={() => confirmRemove(row)} disabled={removeMutation.isPending} />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const MANUFACTURING_PLANT_SORT_OPTIONS: SortOption[] = [
  { key: "id", label: "ID", kind: "number" },
  { key: "name", label: "Nombre", kind: "text" },
  { key: "lat", label: "Latitud", kind: "number" },
  { key: "lng", label: "Longitud", kind: "number" },
  { key: "createdAt", label: "Fecha de creación", kind: "date" },
  { key: "updatedAt", label: "Última actualización", kind: "date" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const MANUFACTURING_PLANT_DEFAULT_SORT: SortState = { orderBy: "id", order: "desc" };
