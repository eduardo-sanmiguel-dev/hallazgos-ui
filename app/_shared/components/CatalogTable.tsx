import { type ReactNode, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Chip, Typography } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import ResponsiveTable, { type ResponsiveTableProps } from "./ResponsiveTable";
import { useConfirmDialog } from "./ConfirmDialog";
import axiosWrapper from "@services/axiosWrapper";
import { notify } from "@shared/utils";

const api = axiosWrapper({ baseURL: "/catalogs" });
type CatalogRow = { id: number; isActive?: boolean; scheduledAt?: string };

export function CatalogStatus({ active }: { active?: boolean }) {
  return (
    <Chip
      size="small"
      label={active === false ? "Inactivo" : "Activo"}
      color={active === false ? "default" : "success"}
    />
  );
}

export function CatalogActions({
  catalog,
  row,
  onActivated,
  children,
}: {
  catalog: string;
  row: CatalogRow;
  onActivated: () => void;
  children?: ReactNode;
}) {
  const [openedAt] = useState(() => Date.now());
  const { confirm, confirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.patch(`/${catalog}/${row.id}/activate`),
    onSuccess: async () => {
      notify("Registro reactivado correctamente", true);
      await queryClient.invalidateQueries({ queryKey: ["catalogs"] });
      onActivated();
    },
  });
  if (row.isActive !== false) return children;
  if (
    catalog === "gemba-walk-calendar" &&
    row.scheduledAt &&
    new Date(row.scheduledAt).getTime() <= openedAt
  )
    return <Typography variant="body2">Evento pasado: cree una nueva programación</Typography>;
  const activate = () =>
    confirm({
      title: "Reactivar registro",
      description: `¿Desea reactivar el registro #${row.id}? Volverá a estar disponible si sus dependencias están activas.`,
      confirmLabel: "Reactivar",
      action: () => mutation.mutateAsync().then(() => undefined),
    });
  return (
    <>
      <Chip
        icon={<RestoreIcon />}
        label="Reactivar"
        color="primary"
        variant="outlined"
        disabled={mutation.isPending}
        onClick={() => void activate()}
      />
      {confirmDialog}
    </>
  );
}

/** Las tablas administrativas incluyen inactivos; los selectores usan consultas separadas. */
export default function CatalogTable<T extends CatalogRow>({
  catalog,
  onActivated,
  columns,
  actions,
  ...props
}: ResponsiveTableProps<T> & { catalog: string; onActivated: () => void }) {
  const statusColumns = columns.some((column) => column.id === "isActive")
    ? columns
    : [
        ...columns,
        {
          id: "isActive",
          header: "Estado",
          cell: (row: T) => <CatalogStatus active={row.isActive} />,
        },
      ];
  return (
    <ResponsiveTable
      {...props}
      columns={statusColumns}
      actions={(row) => (
        <CatalogActions catalog={catalog} row={row} onActivated={onActivated}>
          {actions?.(row)}
        </CatalogActions>
      )}
    />
  );
}
