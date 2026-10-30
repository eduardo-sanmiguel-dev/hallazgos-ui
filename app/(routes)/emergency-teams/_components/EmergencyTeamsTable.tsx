import { ChangeEvent, MouseEvent } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Theme } from "@mui/material/styles";

import { notify, stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import TablePaginationActions from "@shared/components/TablePaginationActions";
import {
  TableBodyState,
  type ServerPagination,
} from "@shared/components/TableDefaultServer";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import { EmergencyTeam } from "@interfaces";
import { EmergencyTeamsService } from "@services";
import { constants } from "@constants";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";

interface Props {
  // Filas de la página actual (paginadas en la API).
  rows: EmergencyTeam[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  getData: () => void;
  // De usePaginatedList: página, filas por página, total y error.
  pagination: ServerPagination;
}

const EMPTY_TITLE = "Sin registros de equipos de emergencia";

export default function EmergencyTeamsTable({
  rows,
  selectedIds,
  setSelectedIds,
  getData,
  pagination,
}: Props) {
  const { page, setPage, rowsPerPage, setRowsPerPage, count } = pagination;
  // En celular, tarjetas (ResponsiveTable) con su casilla para imprimir.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const paginatedRows = rows;

  const emptyRows =
    page > 0 && rowsPerPage > 0 ? Math.max(0, rowsPerPage - rows.length) : 0;

  const removeMutation = useMutation({
    mutationFn: (id: number) => EmergencyTeamsService.remove(id),
    onSuccess: () => {
      notify("Equipo de emergencia eliminado correctamente", true);
      getData();
    },
  });

  const remove = (id: number) => removeMutation.mutateAsync(id);

  const confirmRemove = async (row: EmergencyTeam) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el equipo #${row.id} (${row.location})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => remove(row.id),
    });
  };

  const isSelected = (id: number) => selectedIds.includes(id);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = paginatedRows.map((row) => row.id);
      const merged = Array.from(new Set([...selectedIds, ...currentPageIds]));
      setSelectedIds(merged);
      return;
    }

    const currentPageIdSet = new Set(paginatedRows.map((row) => row.id));
    setSelectedIds(
      selectedIds.filter((selectedId) => !currentPageIdSet.has(selectedId)),
    );
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, id])));
      return;
    }

    setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const selectedCurrentPageCount = paginatedRows.filter((row) =>
    selectedIds.includes(row.id),
  ).length;
  const currentPageIdSet = new Set(paginatedRows.map((row) => row.id));
  const allChecked =
    paginatedRows.length > 0 &&
    selectedCurrentPageCount === paginatedRows.length;
  const hasSelectionOutsideCurrentPage = selectedIds.some(
    (selectedId) => !currentPageIdSet.has(selectedId),
  );
  const someChecked =
    !allChecked &&
    (selectedCurrentPageCount > 0 || hasSelectionOutsideCurrentPage);

  const handleChangePage = (
    _event: MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const rowActions = (row: EmergencyTeam) => (
    <RowActions>
      <EditAction
        onClick={() => router.push("/emergency-teams/form?id=" + row.id)}
      />
      <DeleteAction
        onClick={() => confirmRemove(row)}
        disabled={removeMutation.isPending}
      />
    </RowActions>
  );

  if (isPhone) {
    // La casilla va en el título de la tarjeta: tocar el texto también
    // selecciona.
    const cardColumns: ResponsiveColumn<EmergencyTeam>[] = [
      {
        id: "select",
        header: "Seleccionar",
        cell: (row) => (
          <FormControlLabel
            sx={{ m: 0, alignItems: "flex-start" }}
            control={
              <Checkbox
                checked={isSelected(row.id)}
                onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                sx={{ mt: -1.25, ml: -1.5 }}
              />
            }
            label={`#${row.id} · ${row.location}`}
          />
        ),
        card: "title",
      },
      {
        id: "plant",
        header: "Planta",
        cell: (row) => row.manufacturingPlant?.name || "-",
        card: "subtitle",
      },
      {
        id: "extinguisherNumber",
        header: "N. Extintor",
        cell: (row) => row.extinguisherNumber,
      },
      { id: "type", header: "Tipo", cell: (row) => row.typeOfExtinguisher },
      { id: "capacity", header: "Capacidad", cell: (row) => row.capacity },
      {
        id: "updatedAt",
        header: "Última actualización",
        cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
      },
    ];

    return (
      <>
        {rows.length > 0 && (
          <Paper variant="outlined" sx={{ px: 2, py: 0.5, mb: 1.5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label="Seleccionar todos los de esta página"
            />
          </Paper>
        )}
        <ResponsiveTable
          rows={rows}
          columns={cardColumns}
          getRowKey={(row) => row.id}
          pagination={pagination}
          ariaLabel="Equipos de emergencia"
          emptyTitle={EMPTY_TITLE}
          emptyDescription="No hay registros con los filtros actuales."
          actions={rowActions}
        />
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table aria-label="Equipos de emergencia">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  slotProps={{
                    input: {
                      "aria-label": "Seleccionar todos los de esta página",
                    },
                  }}
                />
              </StyledTableCell>
              <StyledTableCell>ID</StyledTableCell>
              <StyledTableCell>Planta</StyledTableCell>
              <StyledTableCell>Ubicación</StyledTableCell>
              <StyledTableCell>N. Extintor</StyledTableCell>
              <StyledTableCell>Tipo</StyledTableCell>
              <StyledTableCell>Capacidad</StyledTableCell>
              <StyledTableCell>Creación</StyledTableCell>
              <StyledTableCell>Creado por</StyledTableCell>
              <StyledTableCell>Última actualización</StyledTableCell>
              <StyledTableCell>Actualizado por</StyledTableCell>
              <StyledTableCell>Acciones</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={12} sx={{ borderBottom: 0 }}>
                  {/* Vacío o, si la consulta falló, error con "Reintentar". */}
                  <TableBodyState
                    isError={pagination.isError}
                    onRetry={pagination.onRetry}
                    emptyTitle={EMPTY_TITLE}
                  />
                </TableCell>
              </TableRow>
            )}
            {paginatedRows.map((row) => (
              <StyledTableRow key={row.id} hover>
                <StyledTableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected(row.id)}
                    onChange={(e) => handleSelectOne(row.id, e.target.checked)}
                    slotProps={{
                      input: {
                        "aria-label": `Seleccionar el equipo ${row.id}`,
                      },
                    }}
                  />
                </StyledTableCell>
                <StyledTableCell>{row.id}</StyledTableCell>
                <StyledTableCell>
                  {row.manufacturingPlant?.name || "-"}
                </StyledTableCell>
                <StyledTableCell>{row.location}</StyledTableCell>
                <StyledTableCell>{row.extinguisherNumber}</StyledTableCell>
                <StyledTableCell>{row.typeOfExtinguisher}</StyledTableCell>
                <StyledTableCell>{row.capacity}</StyledTableCell>
                <StyledTableCell>
                  {stringToDateWithTime(row.createdAt)}
                </StyledTableCell>
                <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
                <StyledTableCell>
                  {updatedDateLabel(row.createdAt, row.updatedAt) ?? "-"}
                </StyledTableCell>
                <StyledTableCell>{row.updatedBy?.name || "-"}</StyledTableCell>
                <StyledTableCell>{rowActions(row)}</StyledTableCell>
              </StyledTableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={12} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <StyledTableRow>
              <TablePagination
                rowsPerPageOptions={constants.pagination.rowsPerPageOptions}
                colSpan={12}
                count={count}
                rowsPerPage={rowsPerPage}
                page={page}
                slotProps={{
                  select: {
                    inputProps: {
                      "aria-label": "Filas por página",
                    },
                    native: true,
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </StyledTableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {confirmDialog}
    </>
  );
}
