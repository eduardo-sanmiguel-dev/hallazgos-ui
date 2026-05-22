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

interface Props {
  rows: any[];
  paintRows: (value: any, index: number, array: any[]) => ReactNode;
  columns: string[];
  page?: number;
  setPage?: Dispatch<SetStateAction<number>>;
  rowsPerPage?: number;
  setRowsPerPage?: Dispatch<SetStateAction<number>>;
  count?: number;
}

const TableDefaultServer = ({
  rows,
  paintRows,
  columns,
  page: pageCtrl,
  setPage: setPageCtrl,
  rowsPerPage: rowsPerPageCtrl,
  setRowsPerPage: setRowsPerPageCtrl,
  count,
}: Props) => {
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
      <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
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
