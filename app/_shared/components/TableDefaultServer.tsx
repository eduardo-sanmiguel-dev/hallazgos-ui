import {
  ChangeEvent,
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { Paper } from "@mui/material";

import TableFooterDefault from "./TableFooterDefault";
import { StyledTableCell, StyledTableRow } from "./TableDefault";

interface Props<T> {
  rows: T[];
  // Firma de método para aceptar los `paintRows={(row: X) => ...}` existentes.
  paintRows(value: T, index: number, array: T[]): ReactNode;
  columns: string[];
  page?: number;
  setPage?: Dispatch<SetStateAction<number>>;
  rowsPerPage?: number;
  setRowsPerPage?: Dispatch<SetStateAction<number>>;
  count?: number;
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
  count,
  ariaLabel = "Tabla de registros",
}: Props<T>) => {
  const [page, setPage] = useState(pageCtrl || 0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageCtrl || 5);
  const [colSpan] = useState(columns.length);

  useEffect(() => {
    if (setPageCtrl) {
      setPageCtrl(page);
    }
  }, [page, setPageCtrl]);

  useEffect(() => {
    if (setRowsPerPageCtrl) {
      setRowsPerPageCtrl(rowsPerPage);
    }
  }, [rowsPerPage, setRowsPerPageCtrl]);

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
    <TableContainer component={Paper}>
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
        />
      </Table>
    </TableContainer>
  );
};

export default TableDefaultServer;
