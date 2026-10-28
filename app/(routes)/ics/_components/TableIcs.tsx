import { useState } from "react";

import { notify } from "@shared/utils";
import { ICSData } from "@interfaces";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { IcsService } from "@services";

interface Props {
  rows: ICSData[];
  getData: () => void;
  pagination: ServerPagination;
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
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
  },
  {
    id: "ruleOfLife",
    header: "Regla de vida",
    cell: (row) => row.ruleOfLife.name,
  },
  {
    id: "standardOfBehavior",
    header: "Estandar de comportamiento",
    cell: (row) => row.standardOfBehavior?.name || "",
  },
  {
    id: "areaOfBehavior",
    header: "Área al que aplica",
    cell: (row) => row.areaOfBehavior?.name || "",
  },
  {
    id: "totalPeople",
    header: "Personas totales",
    cell: (row) => row.totalPeople,
  },
  {
    id: "totalCorrectPeople",
    header: "Personas cumpliendo el estándar",
    cell: (row) => row.totalCorrectPeople,
    card: "hidden",
  },
  {
    id: "totalIncorrectPeople",
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
    header: "Índice de comportamiento seguro (%)",
    cell: (row) => `${row.icsPercentage}%`,
    card: "hidden",
  },
];

export default function TableIcs({ rows, getData, pagination }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return IcsService.remove(id)
      .then(() => {
        notify("ICS eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

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
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Registros de ICS"
        emptyTitle="Sin registros de ICS"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
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
