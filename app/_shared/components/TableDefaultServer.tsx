import { ChangeEvent, MouseEvent, ReactNode, useState } from "react";

import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";

import { constants } from "@constants";
import TableFooterDefault from "./TableFooterDefault";
import { StyledTableCell, StyledTableRow } from "./TableDefault";

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
        <TableBody>{rows.map(paintRows)}</TableBody>
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
