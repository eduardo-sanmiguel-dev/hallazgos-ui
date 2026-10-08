import { useState } from "react";
import { toast } from "sonner";

import Image from "next/image";

import { Box } from "@mui/material";
import { Collapse } from "@mui/material";
import { IconButton } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { TablePagination } from "@mui/material";
import { TableSortLabel } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import DeleteIcon from "@mui/icons-material/Delete";

import { stringYYYYMMDDToDDMMYYYY } from "@shared/utils";
import { resolveTriStateSort, SortOrder } from "@shared/utils";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { useUserSessionStore } from "@store";
import { EppService } from "@services";
import { Epp, EppSortableColumn } from "@interfaces";

function Row({
  epp,
  currentUserId,
  onHistoryDeleted,
}: {
  epp: Epp;
  currentUserId: number;
  onHistoryDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);

  const confirmRemoveHistory = (equipmentHistoryId: number) => {
    toast.warning("Confirmar eliminación", {
      description: "¿Desea eliminar este registro del historial?",
      duration: 10000,
      cancel: {
        label: "Cancelar",
        onClick: () => undefined,
      },
      action: {
        label: "Eliminar",
        onClick: async () => {
          await EppService.removeHistory(equipmentHistoryId);
          onHistoryDeleted();
        },
      },
    });
  };

  return (
    <>
      <StyledTableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <StyledTableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          {epp.name}
        </StyledTableCell>
        <StyledTableCell>{epp.code}</StyledTableCell>
        <StyledTableCell>{epp.position.name}</StyledTableCell>
        <StyledTableCell>{epp.area.name}</StyledTableCell>
        <StyledTableCell align="center">
          <SimCardDownloadIcon
            color="primary"
            fontSize="large"
            style={{ cursor: "pointer" }}
            onClick={() => EppService.downloadFile(epp.id, epp.code)}
          />
        </StyledTableCell>
      </StyledTableRow>
      <StyledTableRow>
        <StyledTableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Historial de entrega
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Epp</StyledTableCell>
                    <StyledTableCell>Fecha de entrega</StyledTableCell>
                    <StyledTableCell>Fecha devolución</StyledTableCell>
                    <StyledTableCell>Observaciones</StyledTableCell>
                    <StyledTableCell>Firma</StyledTableCell>
                    <StyledTableCell>Entregado por</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {epp.epps
                    .flatMap((epp) =>
                      epp.equipments.map((item) => ({
                        ...item,
                        signature: epp.signature,
                        createBy: epp.createBy,
                      })),
                    )
                    .map((equipment) => (
                      <StyledTableRow key={equipment.id}>
                        <StyledTableCell component="th" scope="row">
                          {equipment.equipment.name}
                        </StyledTableCell>
                        <StyledTableCell>
                          {stringYYYYMMDDToDDMMYYYY(equipment.deliveryDate)}
                        </StyledTableCell>
                        <StyledTableCell></StyledTableCell>
                        <StyledTableCell>
                          {equipment.observations}
                        </StyledTableCell>
                        <StyledTableCell>
                          <Image
                            src={equipment.signature}
                            alt="Firma digital"
                            style={{ border: "1px solid #ccc" }}
                            width={75}
                            height={50}
                          />
                        </StyledTableCell>
                        <StyledTableCell>
                          {equipment.createBy.name}
                        </StyledTableCell>
                        <StyledTableCell align="center">
                          {equipment.createBy?.id === currentUserId && (
                            <IconButton
                              aria-label="borrar registro"
                              size="small"
                              color="error"
                              onClick={() => confirmRemoveHistory(equipment.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </StyledTableCell>
      </StyledTableRow>
    </>
  );
}

interface Props {
  rows: Epp[];
  count: number;
  isLoading: boolean;
  /** 0-based */
  page: number;
  rowsPerPage: number;
  search: string;
  order: SortOrder;
  orderBy: EppSortableColumn | null;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (order: SortOrder, orderBy: EppSortableColumn | null) => void;
  onHistoryDeleted: () => void;
}

const SORTABLE_HEADERS: Array<{ column: EppSortableColumn; label: string }> = [
  { column: "name", label: "Empleado" },
  { column: "code", label: "Cédula" },
  { column: "position", label: "Cargo" },
  { column: "area", label: "Área" },
];

// Tabla controlada: la búsqueda, el orden y la paginación los resuelve la API;
// aquí solo se muestra la página recibida.
export default function TableEpps({
  rows,
  count,
  isLoading,
  page,
  rowsPerPage,
  search,
  order,
  orderBy,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  onSortChange,
  onHistoryDeleted,
}: Props) {
  const currentUserId = useUserSessionStore((state) => state.id);

  const handleRequestSort = (property: EppSortableColumn) => {
    const { nextOrder, nextOrderBy } = resolveTriStateSort(
      order,
      orderBy,
      property,
    );

    onSortChange(nextOrder, nextOrderBy);
  };

  return (
    <Paper>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          size="small"
          variant="filled"
          label="Buscar"
          placeholder="Empleado, cédula, cargo o área"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </Box>
      <Box sx={{ height: 4 }}>{isLoading && <LinearProgress />}</Box>
      <TableContainer>
        <Table aria-label="collapsible table" size="small">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell />
              {SORTABLE_HEADERS.map(({ column, label }) => (
                <StyledTableCell
                  key={column}
                  sortDirection={orderBy === column ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === column}
                    direction={orderBy === column ? order : "asc"}
                    onClick={() => handleRequestSort(column)}
                  >
                    {label}
                  </TableSortLabel>
                </StyledTableCell>
              ))}
              <StyledTableCell align="center">
                Descargar archivo
              </StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {!rows.length && !isLoading && (
              <StyledTableRow>
                <StyledTableCell
                  colSpan={6}
                  sx={{ py: 2, textAlign: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {search.trim()
                      ? "No se encontraron resultados con la búsqueda actual."
                      : "No hay registros de EPP para esta planta."}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}

            {rows.map((epp) => (
              <Row
                key={epp.id}
                epp={epp}
                currentUserId={currentUserId}
                onHistoryDeleted={onHistoryDeleted}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) =>
          onRowsPerPageChange(parseInt(event.target.value, 10))
        }
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count}`
        }
        showFirstButton
        showLastButton
      />
    </Paper>
  );
}
