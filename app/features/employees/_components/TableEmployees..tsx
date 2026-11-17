import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@shared/navigation";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { Chip } from "@mui/material";

import { notify, stringToDate } from "@shared/utils";
import { Employee } from "@interfaces";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { DeleteAction, EditAction, RowActions } from "@shared/components/RowActions";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import type { ResponsiveColumn } from "@shared/components/ResponsiveTable";
import CatalogTable from "@shared/components/CatalogTable";
import { EmployeesService } from "@services";
import type { TableSortControl } from "@hooks/useTableSort";
import type { SortOption, SortState } from "@shared/utils";

interface Props {
  rows: Employee[];
  getData: () => void;
  pagination: ServerPagination;
  // Orden en la API (useTableSort): encabezados ordenables.
  sorting?: TableSortControl;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable, M6):
// nombre, código, estado, área, puesto, plantas y admisión.
const columns: ResponsiveColumn<Employee>[] = [
  {
    id: "code",
    sortKey: "code",
    header: "Código",
    cell: (row) => row.code,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", sortKey: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "codeCard",
    header: "Código",
    cell: (row) => `Código ${row.code}`,
    card: "subtitle",
    hideInTable: true,
  },
  {
    id: "dateOfAdmission",
    sortKey: "dateOfAdmission",
    header: "Fecha de admisión",
    cell: (row) => (row.dateOfAdmission ? stringToDate(row.dateOfAdmission) : ""),
    cellSx: { minWidth: 180 },
  },
  {
    id: "birthdate",
    sortKey: "birthdate",
    header: "Fecha de nacimiento",
    cell: (row) => (row.birthdate ? stringToDate(row.birthdate) : ""),
    cellSx: { minWidth: 180 },
    card: "hidden",
  },
  {
    id: "isActive",
    sortKey: "isActive",
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
  { id: "area", sortKey: "area", header: "Área", cell: (row) => row.area?.name || "" },
  {
    id: "position",
    sortKey: "position",
    header: "Puesto",
    cell: (row) => row.position?.name || "",
  },
  {
    id: "gender",
    sortKey: "gender",
    header: "Género",
    cell: (row) => row.gender?.name || "",
    card: "hidden",
  },
  {
    id: "plants",
    header: "Plantas",
    cell: (row) => row.manufacturingPlants.map((plant) => plant.name).join(", "),
  },
];

export default function TableEmployees({ rows, getData, pagination, sorting }: Props) {
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
      <CatalogTable
        sorting={sorting}
        catalog="employees"
        onActivated={getData}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        pagination={pagination}
        ariaLabel="Colaboradores"
        emptyTitle="Sin registros de colaboradores"
        emptyDescription="No hay registros con los filtros actuales."
        actions={(row) => (
          <RowActions>
            <EditAction onClick={() => router.push("/employees/form?id=" + row.id)} />
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

/** Columnas que la API puede ordenar (misma lista blanca que el backend). */
export const EMPLOYEE_SORT_OPTIONS: SortOption[] = [
  { key: "name", label: "Nombre", kind: "text" },
  { key: "code", label: "Código", kind: "number" },
  { key: "dateOfAdmission", label: "Fecha de admisión", kind: "date" },
  { key: "birthdate", label: "Fecha de nacimiento", kind: "date" },
  { key: "area", label: "Área", kind: "text" },
  { key: "position", label: "Puesto", kind: "text" },
  { key: "gender", label: "Género", kind: "text" },
  { key: "isActive", label: "Estado", kind: "status" },
];

export const EMPLOYEE_DEFAULT_SORT: SortState = { orderBy: "name", order: "asc" };
