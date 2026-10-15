import { ChangeEvent, MouseEvent } from "react";

import { TableFooter } from "@mui/material";
import { TableRow } from "@mui/material";
import { TablePagination } from "@mui/material";

import TablePaginationActions from "@shared/components/TablePaginationActions";

interface Props {
  rows: readonly unknown[];
  page: number;
  rowsPerPage: number;
  handleChangePage: (
    _: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => void;
  handleChangeRowsPerPage: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  colSpan: number;
  count?: number;
}

const TableFooterDefault = ({
  rows,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  colSpan,
  count,
}: Props) => {
  return (
    <TableFooter>
      <TableRow>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, { label: "Todos", value: -1 }]}
          colSpan={colSpan}
          count={count ?? rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={TablePaginationActions}
        />
      </TableRow>
    </TableFooter>
  );
};

export default TableFooterDefault;
