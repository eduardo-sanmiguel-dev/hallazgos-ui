import { useState } from "react";
import { useRouter } from "next/navigation";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Chip } from "@mui/material";

import { notify, stringToDate } from "@shared/utils";
import { Employee } from "@interfaces";
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
import { EmployeesService } from "@services";

interface Props {
  rows: Employee[];
  getData: () => void;
}

const columns = [
  "Código",
  "Nombre",
  "Fecha de admisión",
  "Fecha de nacimiento",
  "Estado",
  "Área",
  "Puesto",
  "Genero",
  "Plantas",
  "Acciones",
];

export default function TableEmployees({ rows, getData }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const remove = (id: number) => {
    setIsLoading(true);
    EmployeesService.remove(id)
      .then(() => {
        notify("Colaborador desactivado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: Employee) => {
    const confirmed = await confirm({
      title: "Desactivar colaborador",
      description: `¿Deseas desactivar al colaborador "${row.name}"?`,
      confirmLabel: "Desactivar",
      tone: "danger",
    });

    if (confirmed) remove(row.id);
  };

  return (
    <>
      <TableDefault
        rows={rows}
        columns={columns}
        paintRows={(row: Employee) => {
          return (
            <StyledTableRow key={row.id}>
              <StyledTableCell component="th" scope="row">
                {row.code}
              </StyledTableCell>
              <StyledTableCell>{row.name}</StyledTableCell>
              <StyledTableCell style={{ minWidth: 180 }}>
                {row.dateOfAdmission ? stringToDate(row.dateOfAdmission) : ""}
              </StyledTableCell>
              <StyledTableCell style={{ minWidth: 180 }}>
                {row.birthdate ? stringToDate(row.birthdate) : ""}
              </StyledTableCell>
              <StyledTableCell>
                <Chip
                  icon={
                    row.isActive ? (
                      <CheckCircleOutlineIcon />
                    ) : (
                      <HighlightOffIcon />
                    )
                  }
                  label={row.isActive ? "Activo" : "Inactivo"}
                  color={row.isActive ? "success" : "error"}
                  size="small"
                />
              </StyledTableCell>
              <StyledTableCell>{row.area?.name || ""}</StyledTableCell>
              <StyledTableCell>{row.position?.name || ""}</StyledTableCell>
              <StyledTableCell>{row.gender?.name || ""}</StyledTableCell>
              <StyledTableCell>
                {row.manufacturingPlants.map((plant) => plant.name).join(", ")}
              </StyledTableCell>
              <StyledTableCell>
                <RowActions>
                  <EditAction
                    onClick={() => router.push("/employees/form?id=" + row.id)}
                  />
                  {row.isActive && (
                    <DeleteAction
                      label="Desactivar"
                      onClick={() => confirmRemove(row)}
                      disabled={isLoading}
                    />
                  )}
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
