import { useState } from "react";

import { useRouter } from "next/navigation";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
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
import { GembaWalkZone } from "@interfaces";
import { GembaWalkZonesService } from "@services";

interface Props {
  rows: GembaWalkZone[];
  getData: () => void;
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Planta",
  "Zona",
  "Ubicación",
  "Creado por",
  "Actualizado por",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableGembaWalkZones({
  rows,
  getData,
  pagination,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    return GembaWalkZonesService.remove(id)
      .then(() => {
        notify("Zona eliminada correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

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
      <TableDefaultServer
        rows={rows}
        columns={columns}
        {...pagination}
        paintRows={(row: GembaWalkZone) => (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>
              {row.manufacturingPlant?.name || "-"}
            </StyledTableCell>
            <StyledTableCell>{row.nameZone}</StyledTableCell>
            <StyledTableCell>{row.nameLocation}</StyledTableCell>
            <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
            <StyledTableCell>{row.updatedBy?.name || "-"}</StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.createdAt)}
            </StyledTableCell>
            <StyledTableCell>
              {updatedDateLabel(row.createdAt, row.updatedAt) ?? "-"}
            </StyledTableCell>
            <StyledTableCell>
              <RowActions>
                <EditAction
                  onClick={() =>
                    router.push("/gemba-walk/zones/form?id=" + row.id)
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
