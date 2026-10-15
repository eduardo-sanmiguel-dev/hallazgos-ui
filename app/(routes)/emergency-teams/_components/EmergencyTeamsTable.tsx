import { ChangeEvent, MouseEvent, useEffect, useState } from "react";

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

import { notify, stringToDateWithTime } from "@shared/utils";
import TablePaginationActions from "@shared/components/TablePaginationActions";
import EmptyState from "@shared/components/EmptyState";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import { EmergencyTeam } from "@interfaces";
import { EmergencyTeamsService } from "@services";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";

interface Props {
  rows: EmergencyTeam[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  getData: () => void;
}

export default function EmergencyTeamsTable({
  rows,
  selectedIds,
  setSelectedIds,
  getData,
}: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const paginatedRows =
    rowsPerPage > 0
      ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : rows;

  const emptyRows =
    page > 0 && rowsPerPage > 0
      ? Math.max(0, (1 + page) * rowsPerPage - rows.length)
      : 0;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [rows.length, rowsPerPage, page]);

  const remove = (id: number) => {
    setIsLoading(true);
    EmergencyTeamsService.remove(id)
      .then(() => {
        notify("Equipo de emergencia eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemove = async (row: EmergencyTeam) => {
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      description: `¿Desea eliminar el equipo #${row.id} (${row.location})?`,
      confirmLabel: "Eliminar",
      tone: "danger",
    });

    if (confirmed) remove(row.id);
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
              <StyledTableCell>Ultima actualización</StyledTableCell>
              <StyledTableCell>Actualizado por</StyledTableCell>
              <StyledTableCell>Acciones</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={12} sx={{ borderBottom: 0 }}>
                  <EmptyState size="small" />
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
                  {stringToDateWithTime(row.updatedAt)}
                </StyledTableCell>
                <StyledTableCell>{row.updatedBy?.name || "-"}</StyledTableCell>
                <StyledTableCell>
                  <RowActions>
                    <EditAction
                      onClick={() =>
                        router.push("/emergency-teams/form?id=" + row.id)
                      }
                    />
                    <DeleteAction
                      onClick={() => confirmRemove(row)}
                      disabled={isLoading}
                    />
                  </RowActions>
                </StyledTableCell>
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
                rowsPerPageOptions={[5, 10, 25, { label: "Todos", value: -1 }]}
                colSpan={12}
                count={rows.length}
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
