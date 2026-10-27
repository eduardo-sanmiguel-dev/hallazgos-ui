import { ChangeEvent, MouseEvent, ReactNode, useState } from "react";

import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableCell } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { TableRow } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";

import { constants } from "@constants";
import TableFooterDefault from "./TableFooterDefault";
import { StyledTableCell, StyledTableRow } from "./TableDefault";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

type RowsPerPageOptions = (number | { label: string; value: number })[];

/** Paginación controlada (la que devuelve usePaginatedList). */
export interface ServerPagination {
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  rowsPerPageOptions?: RowsPerPageOptions;
  count: number;
  isFetching?: boolean;
  /** La consulta falló: sin filas se muestra ErrorState con "Reintentar". */
  isError?: boolean;
  onRetry?: () => void;
}

interface Props<T> {
  rows: T[];
  // Firma de método para aceptar los `paintRows={(row: X) => ...}` existentes.
  paintRows(value: T, index: number, array: T[]): ReactNode;
  columns: string[];
  // Con setPage/setRowsPerPage la paginación es controlada por el padre;
  // sin ellos, la tabla la maneja internamente.
  page?: number;
  setPage?: (page: number) => void;
  rowsPerPage?: number;
  setRowsPerPage?: (rowsPerPage: number) => void;
  rowsPerPageOptions?: RowsPerPageOptions;
  count?: number;
  // Recarga en curso con datos visibles: barra fina sin desmontar la tabla.
  isFetching?: boolean;
  // Nombre accesible de la tabla.
  ariaLabel?: string;
  isError?: boolean;
  onRetry?: () => void;
  // Mensaje cuando no hay filas (por omisión "Sin registros").
  emptyTitle?: string;
  emptyDescription?: ReactNode;
}

// Fila de la tabla sin registros: vacío o, si la consulta falló, error con
// "Reintentar". También la usa ResponsiveTable en tarjetas.
export function TableBodyState({
  isError = false,
  onRetry,
  emptyTitle,
  emptyDescription,
}: Pick<Props<unknown>, "isError" | "onRetry" | "emptyTitle" | "emptyDescription">) {
  return isError ? (
    <ErrorState
      size="small"
      offline={typeof navigator !== "undefined" && !navigator.onLine}
      onRetry={onRetry}
    />
  ) : (
    <EmptyState size="small" title={emptyTitle} description={emptyDescription} />
  );
}

const TableDefaultServer = <T,>({
  rows,
  paintRows,
  columns,
  page: pageCtrl,
  setPage: setPageCtrl,
  rowsPerPage: rowsPerPageCtrl,
  setRowsPerPage: setRowsPerPageCtrl,
  rowsPerPageOptions,
  count,
  isFetching = false,
  ariaLabel = "Tabla de registros",
  isError = false,
  onRetry,
  emptyTitle,
  emptyDescription,
}: Props<T>) => {
  const [pageLocal, setPageLocal] = useState(pageCtrl || 0);
  const [rowsPerPageLocal, setRowsPerPageLocal] = useState(
    rowsPerPageCtrl || constants.pagination.defaultRowsPerPage,
  );
  const [colSpan] = useState(columns.length);

  const page = setPageCtrl ? (pageCtrl ?? 0) : pageLocal;
  const rowsPerPage = setRowsPerPageCtrl
    ? (rowsPerPageCtrl ?? constants.pagination.defaultRowsPerPage)
    : rowsPerPageLocal;
  const setPage = setPageCtrl ?? setPageLocal;
  const setRowsPerPage = setRowsPerPageCtrl ?? setRowsPerPageLocal;

  const handleChangePage = (
    _: MouseEvent<HTMLButtonElement> | null,
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
    <TableContainer component={Paper} aria-busy={isFetching}>
      <Box sx={{ height: 4 }}>
        {isFetching && <LinearProgress aria-label="Actualizando" />}
      </Box>
      <Table sx={{ minWidth: 500 }} aria-label={ariaLabel}>
        <TableHead>
          <StyledTableRow>
            {columns.map((column) => (
              <StyledTableCell
                key={column}
                sx={{
                  whiteSpace: "pre-line",
                  lineHeight: 1.35,
                }}
              >
                {column}
              </StyledTableCell>
            ))}
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && !isFetching && (
            <TableRow>
              <TableCell colSpan={colSpan} sx={{ borderBottom: 0 }}>
                <TableBodyState
                  isError={isError}
                  onRetry={onRetry}
                  emptyTitle={emptyTitle}
                  emptyDescription={emptyDescription}
                />
              </TableCell>
            </TableRow>
          )}
          {rows.map(paintRows)}
        </TableBody>
        <TableFooterDefault
          rows={rows}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          colSpan={colSpan}
          count={count}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      </Table>
    </TableContainer>
  );
};

export default TableDefaultServer;
