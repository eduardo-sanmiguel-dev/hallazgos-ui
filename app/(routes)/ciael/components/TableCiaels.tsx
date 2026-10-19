import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { Paper } from "@mui/material";
import { TableCell, TableRow } from "@mui/material";
import { Box, LinearProgress } from "@mui/material";
import { ChangeEvent } from "react";

import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableFooterDefault from "@shared/components/TableFooterDefault";
import type { ServerPagination } from "@shared/components/TableDefaultServer";
import EmptyState from "@shared/components/EmptyState";
import { Ciael } from "@interfaces";
import { stringToDate, stringToDateWithTime } from "@shared/utils";

interface Props {
  data: Ciael[];
  pagination: ServerPagination;
}

export default function TableCiaels({ data, pagination }: Props) {
  const { page, setPage, rowsPerPage, setRowsPerPage, count, isFetching } =
    pagination;

  return (
    <TableContainer component={Paper} aria-busy={isFetching}>
      <Box sx={{ height: 4 }}>
        {isFetching && <LinearProgress aria-label="Actualizando" />}
      </Box>
      <Table
        sx={{ minWidth: data.length ? 650 : undefined }}
        aria-label="Registros CIAEL"
      >
        <TableHead>
          <StyledTableRow>
            <StyledTableCell>Tipo de evento</StyledTableCell>
            <StyledTableCell>Colaborador</StyledTableCell>
            <StyledTableCell>Fecha de evento</StyledTableCell>
            <StyledTableCell>Diagnostico CIE</StyledTableCell>
            <StyledTableCell>Área</StyledTableCell>
            <StyledTableCell>Zona</StyledTableCell>
            <StyledTableCell>Fecha de creación</StyledTableCell>
            <StyledTableCell>Usuario que reporto</StyledTableCell>
          </StyledTableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} sx={{ borderBottom: 0 }}>
                <EmptyState title="Sin registros CIAEL" size="small" />
              </TableCell>
            </TableRow>
          )}
          {data.map((ciael) => (
            <StyledTableRow
              key={ciael.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <StyledTableCell component="th" scope="row">
                {ciael.typeOfEvent.name}
              </StyledTableCell>
              <StyledTableCell>{ciael.employee.name}</StyledTableCell>
              <StyledTableCell>{stringToDate(ciael.eventDate)}</StyledTableCell>
              <StyledTableCell>{ciael.cieDiagnosis.name}</StyledTableCell>
              <StyledTableCell>{ciael.zone.area?.name}</StyledTableCell>
              <StyledTableCell>{ciael.zone.name}</StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(ciael.createdAt)}
              </StyledTableCell>
              <StyledTableCell>{ciael.createdBy.name}</StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
        <TableFooterDefault
          rows={data}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={(_, newPage) => setPage(newPage)}
          handleChangeRowsPerPage={(
            event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => {
            setRowsPerPage(parseInt(event.target.value, 10));
          }}
          colSpan={8}
          count={count}
        />
      </Table>
    </TableContainer>
  );
}
