"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChangeEvent } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MainTypesGlobalTrendDetails } from "@interfaces";
import { StyledTableCell } from "@shared/components/TableDefault";
import { Order, SortableColumn } from "./mainTypesGlobalTrend.helpers";

interface MainTypesResponsiblesTabProps {
  detailTab: number;
  detailsData: MainTypesGlobalTrendDetails[];
  filteredDetails: MainTypesGlobalTrendDetails[];
  paginatedDetails: MainTypesGlobalTrendDetails[];
  isDetailsLoading: boolean;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  order: Order;
  orderBy: SortableColumn | null;
  page: number;
  rowsPerPage: number;
  handleRequestSort: (property: SortableColumn) => void;
  handleChangePage: (_: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Pestaña "Detalle por responsables" del tipo seleccionado; el estado vive en MainTypesGlobalTrendAdmin. */
export const MainTypesResponsiblesTab = ({
  detailTab,
  detailsData,
  filteredDetails,
  paginatedDetails,
  isDetailsLoading,
  searchTerm,
  setSearchTerm,
  order,
  orderBy,
  page,
  rowsPerPage,
  handleRequestSort,
  handleChangePage,
  handleChangeRowsPerPage,
}: MainTypesResponsiblesTabProps) => (
  <Box role="tabpanel" hidden={detailTab !== 1}>
    {detailTab === 1 && (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {`${detailsData.length} responsables`}
        </Typography>

        <Box
          sx={{
            p: 1,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "action.hover",
          }}
        >
          <TextField
            fullWidth
            size="small"
            variant="filled"
            label="Buscar en todas las columnas"
            placeholder="Ej. responsable, abiertas, % resolución, días..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Box>

        <TableContainer>
          <Table size="small" aria-label="Detalle por tipo principal">
            <TableHead>
              <TableRow>
                <StyledTableCell
                  sortDirection={orderBy === "responsable_id" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "responsable_id"}
                    direction={orderBy === "responsable_id" ? order : "asc"}
                    onClick={() => handleRequestSort("responsable_id")}
                  >
                    ID
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "responsable" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "responsable"}
                    direction={orderBy === "responsable" ? order : "asc"}
                    onClick={() => handleRequestSort("responsable")}
                  >
                    Responsable
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "total_asignadas" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "total_asignadas"}
                    direction={orderBy === "total_asignadas" ? order : "asc"}
                    onClick={() => handleRequestSort("total_asignadas")}
                  >
                    Total asignadas
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "abiertas" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "abiertas"}
                    direction={orderBy === "abiertas" ? order : "asc"}
                    onClick={() => handleRequestSort("abiertas")}
                  >
                    Abiertas
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "cerradas" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "cerradas"}
                    direction={orderBy === "cerradas" ? order : "asc"}
                    onClick={() => handleRequestSort("cerradas")}
                  >
                    Cerradas
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "canceladas" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "canceladas"}
                    direction={orderBy === "canceladas" ? order : "asc"}
                    onClick={() => handleRequestSort("canceladas")}
                  >
                    Canceladas
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={orderBy === "pct_resolucion" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "pct_resolucion"}
                    direction={orderBy === "pct_resolucion" ? order : "asc"}
                    onClick={() => handleRequestSort("pct_resolucion")}
                  >
                    % Resolucion
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={
                    orderBy === "promedio_dias_resolucion" ? order : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === "promedio_dias_resolucion"}
                    direction={
                      orderBy === "promedio_dias_resolucion" ? order : "asc"
                    }
                    onClick={() =>
                      handleRequestSort("promedio_dias_resolucion")
                    }
                  >
                    Promedio dias resolucion
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={
                    orderBy === "criticos_mas_90_dias" ? order : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === "criticos_mas_90_dias"}
                    direction={
                      orderBy === "criticos_mas_90_dias" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("criticos_mas_90_dias")}
                  >
                    Criticos +90 dias
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={
                    orderBy === "asignadas_mes_anterior" ? order : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === "asignadas_mes_anterior"}
                    direction={
                      orderBy === "asignadas_mes_anterior" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("asignadas_mes_anterior")}
                  >
                    Asignadas mes anterior
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={
                    orderBy === "asignadas_mes_actual" ? order : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === "asignadas_mes_actual"}
                    direction={
                      orderBy === "asignadas_mes_actual" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("asignadas_mes_actual")}
                  >
                    Asignadas mes actual
                  </TableSortLabel>
                </StyledTableCell>
                <StyledTableCell
                  sortDirection={
                    orderBy === "max_dias_sin_resolver" ? order : false
                  }
                >
                  <TableSortLabel
                    active={orderBy === "max_dias_sin_resolver"}
                    direction={
                      orderBy === "max_dias_sin_resolver" ? order : "asc"
                    }
                    onClick={() => handleRequestSort("max_dias_sin_resolver")}
                  >
                    Max dias sin resolver
                  </TableSortLabel>
                </StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isDetailsLoading && (
                <TableRow>
                  <StyledTableCell colSpan={12}>
                    Cargando detalle del tipo principal...
                  </StyledTableCell>
                </TableRow>
              )}

              {!isDetailsLoading && !filteredDetails.length && (
                <TableRow>
                  <StyledTableCell colSpan={12}>
                    <Typography variant="body2" color="text.secondary">
                      {detailsData.length
                        ? "No se encontraron resultados con la busqueda actual."
                        : "No hay detalle para el tipo principal seleccionado."}
                    </Typography>
                  </StyledTableCell>
                </TableRow>
              )}

              {!isDetailsLoading &&
                paginatedDetails.map((item, index) => (
                  <TableRow key={`${item.responsable_id}-${index}`}>
                    <StyledTableCell>{item.responsable_id}</StyledTableCell>
                    <StyledTableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={item.responsable || ""} arrow>
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.responsable}
                        </Typography>
                      </Tooltip>
                    </StyledTableCell>
                    <StyledTableCell>{item.total_asignadas}</StyledTableCell>
                    <StyledTableCell>{item.abiertas}</StyledTableCell>
                    <StyledTableCell>{item.cerradas}</StyledTableCell>
                    <StyledTableCell>{item.canceladas}</StyledTableCell>
                    <StyledTableCell>{item.pct_resolucion}</StyledTableCell>
                    <StyledTableCell>
                      {item.promedio_dias_resolucion}
                    </StyledTableCell>
                    <StyledTableCell>
                      {item.criticos_mas_90_dias}
                    </StyledTableCell>
                    <StyledTableCell>
                      {item.asignadas_mes_anterior}
                    </StyledTableCell>
                    <StyledTableCell>
                      {item.asignadas_mes_actual}
                    </StyledTableCell>
                    <StyledTableCell>
                      {item.max_dias_sin_resolver}
                    </StyledTableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!isDetailsLoading && !!filteredDetails.length && (
          <TablePagination
            component="div"
            count={filteredDetails.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Filas por pagina"
            showFirstButton
            showLastButton
          />
        )}
      </Stack>
    )}
  </Box>
);
