import { useMutation } from "@tanstack/react-query";
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
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { EmployeesService } from "@services";

interface Props {
  rows: Employee[];
  getData: () => void;
  pagination: ServerPagination;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, M6):
// nombre, código, estado, área, puesto, plantas y admisión.
const columns: ResponsiveColumn<Employee>[] = [
  {
    id: "code",
    header: "Código",
    cell: (row) => row.code,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "codeCard",
    header: "Código",
    cell: (row) => `Código ${row.code}`,
    card: "subtitle",
    hideInTable: true,
  },
  {
    id: "dateOfAdmission",
    header: "Fecha de admisión",
    cell: (row) =>
      row.dateOfAdmission ? stringToDate(row.dateOfAdmission) : "",
    cellSx: { minWidth: 180 },
  },
  {
    id: "birthdate",
    header: "Fecha de nacimiento",
    cell: (row) => (row.birthdate ? stringToDate(row.birthdate) : ""),
    cellSx: { minWidth: 180 },
    card: "hidden",
  },
  {
    id: "isActive",
    header: "Estado",
    cell: (row) => (
      <Chip
        icon={row.isActive ? <CheckCircleOutlineIcon /> : <HighlightOffIcon />}
        label={row.isActive ? "Activo" : "Inactivo"}
        color={row.isActive ? "success" : "error"}
        size="small"
      />
    ),
  },
  { id: "area", header: "Área", cell: (row) => row.area?.name || "" },
  { id: "position", header: "Puesto", cell: (row) => row.position?.name || "" },
  {
    id: "gender",
    header: "Género",
    cell: (row) => row.gender?.name || "",
    card: "hidden",
  },
  {
    id: "plants",
    header: "Plantas",
    cell: (row) =>
      row.manufacturingPlants.map((plant) => plant.name).join(", "),
  },
];

export default function TableEmployees({ rows, getData, pagination }: Props) {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const removeMutation = useMutation({
    mutationFn: (id: number) => EmployeesService.remove(id),
    onSuccess: () => {
      notify("Colaborador desactivado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: Employee) => {
    await confirm({
      title: "Desactivar colaborador",
      description: `¿Deseas desactivar al colaborador "${row.name}"?`,
      confirmLabel: "Desactivar",
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
        ariaLabel="Colaboradores"
        emptyTitle="Sin registros de colaboradores"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction
              onClick={() => router.push("/employees/form?id=" + row.id)}
            />
            {row.isActive && (
              <DeleteAction
                label="Desactivar"
                onClick={() => confirmRemove(row)}
                disabled={removeMutation.isPending}
              />
            )}
          </RowActions>
        )}
      />
      {confirmDialog}
    </>
  );
}
