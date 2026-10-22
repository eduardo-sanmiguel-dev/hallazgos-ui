import { ChangeEvent, MouseEvent } from "react";

import { TableFooter } from "@mui/material";
import { TableRow } from "@mui/material";
import { TablePagination } from "@mui/material";

import TablePaginationActions from "@shared/components/TablePaginationActions";
import { constants } from "@constants";

interface Props {
  rows: readonly unknown[];
  page: number;
  rowsPerPage: number;
  handleChangePage: (
    _: MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => void;
  handleChangeRowsPerPage: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  colSpan: number;
  count?: number;
  /** Por omisión 10/25/50, sin "Todos" (ver useRowsPerPage). */
  rowsPerPageOptions?: (number | { label: string; value: number })[];
}

const TableFooterDefault = ({
  rows,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  colSpan,
  count,
  rowsPerPageOptions = constants.pagination.rowsPerPageOptions,
}: Props) => {
  return (
    <TableFooter>
      <TableRow>
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
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
