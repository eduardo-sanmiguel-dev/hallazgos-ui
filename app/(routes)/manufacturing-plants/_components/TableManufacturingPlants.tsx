import { useState } from "react";

import { useRouter } from "next/navigation";

import { notify, stringToDateWithTime } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer, {
  type ServerPagination,
} from "@shared/components/TableDefaultServer";
import { ManufacturingPlant } from "@interfaces";
import { ManufacturingPlantsService } from "@services";

interface Props {
  rows: ManufacturingPlant[];
  getData: () => void;
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Nombre",
  "Latitud",
  "Longitud",
  "Link",
  "Creación",
  "Ultima actualización",
  "Acciones",
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
      <TableDefaultServer
        rows={rows}
        columns={columns}
        {...pagination}
        paintRows={(row: ManufacturingPlant) => (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>{row.name}</StyledTableCell>
            <StyledTableCell>{row.lat}</StyledTableCell>
            <StyledTableCell>{row.lng}</StyledTableCell>
            <StyledTableCell>
              <a href={row.link} target="_blank" rel="noreferrer">
                {row.link}
              </a>
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.createdAt)}
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.updatedAt)}
            </StyledTableCell>
            <StyledTableCell>
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
            </StyledTableCell>
          </StyledTableRow>
        )}
      />
      {confirmDialog}
    </>
  );
}
