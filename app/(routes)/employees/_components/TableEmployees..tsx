import { useState } from "react";
import { useRouter } from "next/navigation";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Stack } from "@mui/material";
import { Chip } from "@mui/material";

import { notify, stringToDate } from "@shared/utils";
import { Employee } from "@interfaces";
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

  const remove = (id: number) => {
    setIsLoading(true);
    EmployeesService.remove(id)
      .then(() => {
        notify("Colaborador desactivado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  return (
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
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<EditIcon />}
                  label="Editar"
                  color="warning"
                  onClick={() => router.push("/employees/form?id=" + row.id)}
                />
                {row.isActive && (
                  <Chip
                    icon={<DeleteIcon />}
                    label="Desactivar"
                    color="error"
                    onClick={() => remove(row.id)}
                    disabled={isLoading}
                  />
                )}
              </Stack>
            </StyledTableCell>
          </StyledTableRow>
        );
      }}
    />
  );
}
