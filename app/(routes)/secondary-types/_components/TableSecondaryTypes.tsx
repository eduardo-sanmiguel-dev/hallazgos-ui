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
import { SecondaryType } from "@interfaces";
import { SecondaryTypesService } from "@services";

interface Props {
  rows: SecondaryType[];
  getData: () => void;
}

const columns = [
  "ID",
  "Nombre",
  "Criterio",
  "Responsable",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableSecondaryTypes({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    SecondaryTypesService.remove(id)
      .then(() => {
        notify("Tipo de criterio eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: SecondaryType) => {
    const confirmed = await confirm({
      title: "Eliminar tipo de criterio",
      description: `¿Deseas eliminar el tipo de criterio "${row.name}"?`,
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
        paintRows={(row: SecondaryType) => (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>{row.name}</StyledTableCell>
            <StyledTableCell>{row.mainType.name}</StyledTableCell>
            <StyledTableCell>{row.typeResponsible}</StyledTableCell>
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
                    router.push("/secondary-types/form?id=" + row.id)
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
