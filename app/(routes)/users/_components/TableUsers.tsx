import { Dispatch, SetStateAction, useState } from "react";

import { useRouter } from "next/navigation";

import { Tooltip } from "@mui/material";

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
import TableDefaultServer from "@shared/components/TableDefaultServer";
import { User } from "@interfaces";
import { UsersService } from "@services";

interface Props {
  rows: User[];
  getData: () => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  count: number;
}

const columns = [
  "ID",
  "Nombre",
  "Correo electrónico",
  "Plantas",
  "Zonas",
  "Procesos",
  "Role",
  "Creación",
  "Ultima actualización",
  "Acciones",
];

export default function TableUsers({
  rows,
  getData,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  count,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    UsersService.remove(id)
      .then(() => {
        notify("Usuario eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: User) => {
    const confirmed = await confirm({
      title: "Eliminar usuario",
      description: `¿Deseas eliminar al usuario "${row.name}"?`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });

    if (confirmed) remove(row.id);
  };

  const truncateText = (text: string) => {
    if (!text) return "";

    const size = 50;

    return `${text.substring(0, size)} ${text.length > size ? "..." : ""}`;
  };

  return (
    <>
      <TableDefaultServer
        rows={rows}
        columns={columns}
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        count={count}
        paintRows={(row: User) => {
          const zonesName = row.zones
            .map(
              ({ name, manufacturingPlant }) =>
                `${name} (${manufacturingPlant.name})`
            )
            .join("\n");

          const processesName = row.processes
            .map(
              ({ name, manufacturingPlant }) =>
                `${name} (${manufacturingPlant.name})`
            )
            .join("\n");

          return (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.name}</StyledTableCell>
              <StyledTableCell>{row.email}</StyledTableCell>
              <StyledTableCell>
                {row.manufacturingPlants.map(({ name }) => name).join(", ")}
              </StyledTableCell>
              <StyledTableCell>
                <Tooltip title={zonesName}>
                  <div>{truncateText(zonesName)}</div>
                </Tooltip>
              </StyledTableCell>
              <StyledTableCell>
                <Tooltip title={processesName}>
                  <div>{truncateText(processesName)}</div>
                </Tooltip>
              </StyledTableCell>
              <StyledTableCell>{row.role}</StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(row.createdAt)}
              </StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(row.updatedAt)}
              </StyledTableCell>
              <StyledTableCell>
                <RowActions>
                  <EditAction
                    onClick={() => router.push("/users/form?id=" + row.id)}
                  />
                  <DeleteAction
                    onClick={() => confirmRemove(row)}
                    disabled={isLoading}
                  />
                </RowActions>
              </StyledTableCell>
            </StyledTableRow>
          );
        }}
      />
      {confirmDialog}
    </>
  );
}
