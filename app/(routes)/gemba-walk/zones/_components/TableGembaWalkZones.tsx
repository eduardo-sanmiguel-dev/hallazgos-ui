import { useState } from "react";

import { useRouter } from "next/navigation";


import { notify, stringToDateWithTime } from "@shared/utils";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import TableDefault, {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { GembaWalkZone } from "@interfaces";
import { GembaWalkZonesService } from "@services";

interface Props {
  rows: GembaWalkZone[];
  getData: () => void;
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

export default function TableGembaWalkZones({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    GembaWalkZonesService.remove(id)
      .then(() => {
        notify("Zona eliminada correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: GembaWalkZone) => {
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar la zona #${row.id} (${row.nameZone} - ${row.nameLocation})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });

    if (confirmed) remove(row.id);
  };

  return (
    <>
      <TableDefault
        rows={rows}
        columns={columns}
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
              {stringToDateWithTime(row.updatedAt)}
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
