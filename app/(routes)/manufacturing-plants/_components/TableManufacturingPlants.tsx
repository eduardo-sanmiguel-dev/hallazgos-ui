import { useState } from "react";

import { useRouter } from "next/navigation";

import { Link } from "@mui/material";

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
import { ManufacturingPlant } from "@interfaces";
import { ManufacturingPlantsService } from "@services";

interface Props {
  rows: ManufacturingPlant[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable). En la
// tarjeta, el link (largo) se cambia por "Abrir mapa".
const columns: ResponsiveColumn<ManufacturingPlant>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  { id: "lat", header: "Latitud", cell: (row) => row.lat },
  { id: "lng", header: "Longitud", cell: (row) => row.lng },
  {
    id: "link",
    header: "Link",
    cell: (row) => (
      <Link href={row.link} target="_blank" rel="noreferrer">
        {row.link}
      </Link>
    ),
    card: "hidden",
  },
  {
    id: "map",
    header: "Mapa",
    cell: (row) => (
      <Link href={row.link} target="_blank" rel="noreferrer">
        Abrir mapa
      </Link>
    ),
    hideInTable: true,
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

export default function TableManufacturingPlants({
  rows,
  getData,
  pagination,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return ManufacturingPlantsService.remove(id)
      .then(() => {
        notify("Planta eliminada correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

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
      <ResponsiveTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Plantas"
        emptyTitle="Sin registros de plantas"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() =>
                router.push("/manufacturing-plants/form?id=" + row.id)
              }
            />
            <DeleteAction
              onClick={() => confirmRemove(row)}
              disabled={isLoading}
            />
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}
