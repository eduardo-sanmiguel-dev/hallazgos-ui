import { ReactNode, useState, ChangeEvent, MouseEvent } from "react";

import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableFooter } from "@mui/material";
import { TablePagination } from "@mui/material";
import { TableRow } from "@mui/material";
import { Paper } from "@mui/material";
import { TableCell, tableCellClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import { TableHead } from "@mui/material";

import { primarySoftBackground, primaryTextColor } from "../../theme";
import EmptyState from "./EmptyState";
import TablePaginationActions from "./TablePaginationActions";

// Encabezado en verde tenue con texto oscurecido: el blanco sobre el verde de
// marca no llegaba a contraste AA.
export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: primarySoftBackground(theme),
    color: primaryTextColor(theme),
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export interface TableDefaultProps<T> {
  rows: T[];
  // Firma de método (no propiedad flecha) para que TypeScript acepte los
  // `paintRows={(row: X) => ...}` existentes aunque `rows` venga tipado distinto.
  paintRows(value: T, index: number, array: T[]): ReactNode;
  columns: string[];
  count?: number;
  // Nombre accesible de la tabla.
  ariaLabel?: string;
  // Texto cuando no hay registros.
  emptyMessage?: string;
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, { label: "Todos", value: -1 }];

export default function TableDefault<T>({
  rows,
  paintRows,
  columns,
  count,
  ariaLabel = "Tabla de registros",
  emptyMessage = "Sin registros",
}: TableDefaultProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const colSpan = columns.length;

  // Evita un salto de altura al llegar a la última página con filas vacías.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

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
              <StyledTableCell key={column}>{column}</StyledTableCell>
            ))}
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} sx={{ borderBottom: 0 }}>
                <EmptyState title={emptyMessage} size="small" />
              </TableCell>
            </TableRow>
          ) : (
            (rowsPerPage > 0
              ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : rows
            ).map(paintRows)
          )}
          {emptyRows > 0 && (
            <StyledTableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={colSpan} />
            </StyledTableRow>
          )}
        </TableBody>
        <TableFooter>
          <StyledTableRow>
            <TablePagination
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              colSpan={colSpan}
              count={count || rows.length}
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
  );
}
