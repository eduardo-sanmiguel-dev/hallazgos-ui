import { useCallback, useEffect, useRef, useState } from "react";

import Image from "next/image";

import { Alert } from "@mui/material";
import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { Collapse } from "@mui/material";
import { IconButton } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { TablePagination } from "@mui/material";
import { TableSortLabel } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import { Skeleton } from "@mui/material";
import { Stack } from "@mui/material";
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
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { EppService } from "@services";
import { Epp, EppHistoryItem, EppSortableColumn } from "@interfaces";
import { constants } from "@constants";

const HISTORY_COLUMNS = 7;

/** Filas de esqueleto con la forma del historial mientras llega. */
function HistorySkeleton() {
  return Array.from({ length: 3 }, (_, row) => (
    <StyledTableRow key={row}>
      {Array.from({ length: HISTORY_COLUMNS }, (_, cell) => (
        <StyledTableCell key={cell}>
          {cell === 4 ? (
            <Skeleton variant="rounded" width={75} height={50} />
          ) : (
            <Skeleton variant="text" />
          )}
        </StyledTableCell>
      ))}
    </StyledTableRow>
  ));
}

function Row({
  epp,
  manufacturingPlantId,
  currentUserId,
  onHistoryEmptied,
}: {
  epp: Epp;
  manufacturingPlantId: string;
  currentUserId: number;
  onHistoryEmptied: () => void;
}) {
  const [open, setOpen] = useState(false);
  // null = todavía no se ha cargado (se pide al expandir la fila).
  const [history, setHistory] = useState<EppHistoryItem[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const lastRequest = useRef(0);
  const { confirm, confirmDialog } = useConfirmDialog();

  // Devuelve el historial cargado, o null si falló o lo reemplazó otra
  // petición más reciente.
  const loadHistory = useCallback(async () => {
    const request = ++lastRequest.current;
    setStatus("loading");
    try {
      const items = await EppService.findEmployeeHistory(
        epp.id,
        manufacturingPlantId,
      );
      if (request !== lastRequest.current) return null;
      setHistory(items);
      setStatus("idle");
      return items;
    } catch {
      if (request === lastRequest.current) setStatus("error");
      return null;
    }
  }, [epp.id, manufacturingPlantId]);

  // Se pide al expandir y cada vez que la tabla se recarga con la fila
  // abierta (`epp` cambia); mientras llega se muestra lo último cargado.
  useEffect(() => {
    if (open) void loadHistory();
  }, [open, epp, loadHistory]);

  const confirmRemoveHistory = async (equipmentHistoryId: number) => {
    await confirm({
      title: "Confirmar eliminación",
      description: "¿Desea eliminar este registro del historial?",
      confirmLabel: "Eliminar",
      tone: "danger",
      action: async () => {
        await EppService.removeHistory(equipmentHistoryId);
        // Sin entregas el colaborador sale de la lista: se recarga la tabla.
        const items = await loadHistory();
        if (!items?.length) onHistoryEmptied();
      },
    });
  };

  const isFirstLoad = history === null && status !== "error";

  return (
    <>
      <StyledTableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <StyledTableCell>
          <IconButton
            aria-label={
              open
                ? `Ocultar historial de ${epp.name}`
                : `Ver historial de ${epp.name}`
            }
            aria-expanded={open}
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
          <IconButton
            color="primary"
            aria-label={`Descargar archivo de ${epp.name}`}
            onClick={() => EppService.downloadFile(epp.id, epp.code)}
          >
            <SimCardDownloadIcon fontSize="large" />
          </IconButton>
        </StyledTableCell>
      </StyledTableRow>
      <StyledTableRow>
        <StyledTableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", mb: 1 }}
              >
                <Typography variant="h6" component="div">
                  Historial de entrega
                </Typography>
                {/* Anunciado por lectores de pantalla (role="status"). */}
                <Box
                  role="status"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  {isFirstLoad && (
                    <>
                      <CircularProgress size={16} aria-hidden />
                      <Typography variant="body2" color="text.secondary">
                        Cargando historial…
                      </Typography>
                    </>
                  )}
                </Box>
              </Stack>

              {status === "error" && (
                <Alert
                  severity="error"
                  sx={{ mb: 1 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => void loadHistory()}
                    >
                      Reintentar
                    </Button>
                  }
                >
                  {history
                    ? "No se pudo actualizar el historial; se muestra el último cargado."
                    : "No se pudo cargar el historial."}
                </Alert>
              )}

              {/* Al actualizar se conserva lo cargado y se indica arriba. */}
              <Box sx={{ height: 4 }}>
                {status === "loading" && history && (
                  <LinearProgress aria-label="Actualizando historial" />
                )}
              </Box>

              {(history || isFirstLoad) && (
                <Table
                  size="small"
                  aria-label={`Historial de entrega de ${epp.name}`}
                  aria-busy={status === "loading"}
                >
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
                    {!history && <HistorySkeleton />}

                    {history?.length === 0 && (
                      <StyledTableRow>
                        <StyledTableCell
                          colSpan={HISTORY_COLUMNS}
                          sx={{ py: 2, textAlign: "center" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Sin entregas registradas en esta planta.
                          </Typography>
                        </StyledTableCell>
                      </StyledTableRow>
                    )}

                    {history?.map((item) => (
                      <StyledTableRow key={item.id}>
                        <StyledTableCell component="th" scope="row">
                          {item.equipment.name}
                        </StyledTableCell>
                        <StyledTableCell>
                          {stringYYYYMMDDToDDMMYYYY(item.deliveryDate)}
                        </StyledTableCell>
                        <StyledTableCell></StyledTableCell>
                        <StyledTableCell>{item.observations}</StyledTableCell>
                        <StyledTableCell>
                          <Image
                            src={item.signature}
                            alt="Firma digital"
                            style={{ border: "1px solid #ccc" }}
                            width={75}
                            height={50}
                          />
                        </StyledTableCell>
                        <StyledTableCell>{item.createBy?.name}</StyledTableCell>
                        <StyledTableCell align="center">
                          {item.createBy?.id === currentUserId && (
                            <IconButton
                              aria-label="Eliminar registro del historial"
                              size="small"
                              color="error"
                              onClick={() => confirmRemoveHistory(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Collapse>
        </StyledTableCell>
      </StyledTableRow>
      {confirmDialog}
    </>
  );
}

interface Props {
  rows: Epp[];
  // Planta de la lista: el historial de cada fila se pide para esta planta.
  manufacturingPlantId: string;
  count: number;
  isLoading: boolean;
  /** 0-based */
  page: number;
  rowsPerPage: number;
  // Solo para el mensaje de "sin resultados".
  hasFilters: boolean;
  order: SortOrder;
  orderBy: EppSortableColumn | null;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onSortChange: (order: SortOrder, orderBy: EppSortableColumn | null) => void;
  onHistoryDeleted: () => void;
}

const SORTABLE_HEADERS: Array<{ column: EppSortableColumn; label: string }> = [
  { column: "name", label: "Empleado" },
  { column: "code", label: "Cédula" },
  { column: "position", label: "Cargo" },
  { column: "area", label: "Área" },
];

// Tabla controlada: los filtros, el orden y la paginación los resuelve la API;
// aquí solo se muestra la página recibida.
export default function TableEpps({
  rows,
  manufacturingPlantId,
  count,
  isLoading,
  page,
  rowsPerPage,
  hasFilters,
  order,
  orderBy,
  onPageChange,
  onRowsPerPageChange,
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
      <Box sx={{ height: 4 }}>{isLoading && <LinearProgress />}</Box>
      <TableContainer>
        <Table aria-label="Entregas de EPP por colaborador" size="small">
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
                    {hasFilters
                      ? "No se encontraron resultados con los filtros actuales."
                      : "No hay registros de EPP para esta planta."}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}

            {rows.map((epp) => (
              <Row
                // Con la planta en la llave, cambiar de planta descarta el
                // historial cargado (un colaborador puede estar en varias).
                key={`${manufacturingPlantId}-${epp.id}`}
                epp={epp}
                manufacturingPlantId={manufacturingPlantId}
                currentUserId={currentUserId}
                onHistoryEmptied={onHistoryDeleted}
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
        rowsPerPageOptions={constants.pagination.rowsPerPageOptions}
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
