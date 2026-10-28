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
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import ErrorState from "@shared/components/ErrorState";
import { TableBodyState } from "@shared/components/TableDefaultServer";
import { TableSkeleton } from "@shared/components/Skeletons";
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

/** Filas de esqueleto de la lista en su primera carga (6 columnas). */
function ListRowsSkeleton() {
  return (
    <StyledTableRow>
      <StyledTableCell colSpan={6} role="status" aria-label="Cargando…">
        <Stack spacing={1.25} sx={{ py: 1 }}>
          {Array.from({ length: 8 }, (_, row) => (
            <Skeleton key={row} variant="rounded" height={36} />
          ))}
        </Stack>
      </StyledTableCell>
    </StyledTableRow>
  );
}

interface HistoryProps {
  epp: Epp;
  manufacturingPlantId: string;
  currentUserId: number;
  onHistoryEmptied: () => void;
}

// Historial de entregas de un colaborador: se pide al abrirlo y al recargar
// la lista con él abierto. Lo usan la fila de la tabla y la tarjeta de celular.
function useEmployeeHistory({
  epp,
  manufacturingPlantId,
  onHistoryEmptied,
  open,
}: Omit<HistoryProps, "currentUserId"> & { open: boolean }) {
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

  return {
    history,
    status,
    loadHistory,
    confirmRemoveHistory,
    confirmDialog,
    isFirstLoad,
  };
}

function Row({
  epp,
  manufacturingPlantId,
  currentUserId,
  onHistoryEmptied,
}: HistoryProps) {
  const [open, setOpen] = useState(false);
  const {
    history,
    status,
    loadHistory,
    confirmRemoveHistory,
    confirmDialog,
    isFirstLoad,
  } = useEmployeeHistory({
    epp,
    manufacturingPlantId,
    onHistoryEmptied,
    open,
  });

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
                            // Las firmas se guardan transparentes: con fondo
                            // blanco se leen también en el tema oscuro.
                            style={{
                              border: "1px solid #ccc",
                              background: "#fff",
                              objectFit: "contain",
                            }}
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

/**
 * Colaborador en celular: tarjeta con sus datos, descarga y el historial
 * desplegable como lista (en la tabla había que desplazarse de lado).
 */
function EppCard({
  epp,
  manufacturingPlantId,
  currentUserId,
  onHistoryEmptied,
}: HistoryProps) {
  const [open, setOpen] = useState(false);
  const {
    history,
    status,
    loadHistory,
    confirmRemoveHistory,
    confirmDialog,
    isFirstLoad,
  } = useEmployeeHistory({
    epp,
    manufacturingPlantId,
    onHistoryEmptied,
    open,
  });

  return (
    <Paper component="li" variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
            {epp.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cédula {epp.code}
          </Typography>
        </Box>
        <IconButton
          aria-label={`Descargar archivo de ${epp.name}`}
          onClick={() => EppService.downloadFile(epp.id, epp.code)}
          sx={{ color: "text.brand" }}
        >
          <SimCardDownloadIcon />
        </IconButton>
      </Stack>
      <Box
        component="dl"
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(64px, auto) 1fr",
          columnGap: 1.5,
          rowGap: 0.5,
          mt: 1,
          mb: 0,
          "& dt": { color: "text.secondary", typography: "body2" },
          "& dd": { m: 0, typography: "body2", overflowWrap: "anywhere" },
        }}
      >
        <dt>Cargo</dt>
        <dd>{epp.position.name}</dd>
        <dt>Área</dt>
        <dd>{epp.area.name}</dd>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        aria-expanded={open}
        endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        onClick={() => setOpen(!open)}
        sx={{ mt: 1.5 }}
      >
        {open ? "Ocultar historial" : "Ver historial"}
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1.5 }} aria-busy={status === "loading"}>
          {isFirstLoad && (
            <Stack
              direction="row"
              spacing={1}
              role="status"
              sx={{ alignItems: "center" }}
            >
              <CircularProgress size={16} aria-hidden />
              <Typography variant="body2" color="text.secondary">
                Cargando historial…
              </Typography>
            </Stack>
          )}
          {status === "error" && (
            <ErrorState
              size="small"
              title={
                history
                  ? "No se pudo actualizar el historial"
                  : "No se pudo cargar el historial"
              }
              onRetry={() => void loadHistory()}
            />
          )}
          {history?.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Sin entregas registradas en esta planta.
            </Typography>
          )}
          <Stack
            component="ul"
            spacing={1}
            aria-label={`Historial de entrega de ${epp.name}`}
            sx={{ listStyle: "none", m: 0, p: 0 }}
          >
            {history?.map((item) => (
              <Box
                component="li"
                key={item.id}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                  borderTop: 1,
                  borderColor: "divider",
                  pt: 1,
                }}
              >
                <Image
                  src={item.signature}
                  alt="Firma digital"
                  width={96}
                  height={64}
                  style={{
                    border: "1px solid #ccc",
                    background: "#fff",
                    objectFit: "contain",
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.equipment.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stringYYYYMMDDToDDMMYYYY(item.deliveryDate)}
                    {item.createBy?.name ? ` · ${item.createBy.name}` : ""}
                  </Typography>
                  {item.observations && (
                    <Typography variant="body2">{item.observations}</Typography>
                  )}
                </Box>
                {item.createBy?.id === currentUserId && (
                  <IconButton
                    aria-label="Eliminar registro del historial"
                    color="error"
                    onClick={() => confirmRemoveHistory(item.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>
      {confirmDialog}
    </Paper>
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
  // La consulta falló: sin filas se muestra ErrorState con "Reintentar".
  isError?: boolean;
  onRetry?: () => void;
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
  isError = false,
  onRetry,
}: Props) {
  const currentUserId = useUserSessionStore((state) => state.id);
  // En celular, tarjetas: la tabla con historial anidado obligaba a
  // desplazarse de lado.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  // Sin filas: vacío (con o sin filtros) o error con "Reintentar", con los
  // componentes compartidos.
  const bodyState = (
    <TableBodyState
      isError={isError}
      onRetry={onRetry}
      emptyTitle={hasFilters ? "Sin resultados" : "Sin entregas de EPP"}
      emptyDescription={
        hasFilters
          ? "No se encontraron resultados con los filtros actuales."
          : "No hay registros de EPP para esta planta."
      }
    />
  );

  const handleRequestSort = (property: EppSortableColumn) => {
    const { nextOrder, nextOrderBy } = resolveTriStateSort(
      order,
      orderBy,
      property,
    );

    onSortChange(nextOrder, nextOrderBy);
  };

  // Primera carga (sin filas todavía): esqueleto. Al cambiar de página o de
  // filtro se conservan las filas con la barra arriba.
  const isFirstLoad = isLoading && !rows.length;

  return (
    <Paper aria-busy={isLoading}>
      <Box sx={{ height: 4 }}>
        {isLoading && !isFirstLoad && (
          <LinearProgress aria-label="Cargando entregas" />
        )}
      </Box>
      {isPhone ? (
        <Box sx={{ p: 1.5 }}>
          {isFirstLoad ? (
            <TableSkeleton rows={4} />
          ) : !rows.length ? (
            bodyState
          ) : (
            <Stack
              component="ul"
              aria-label="Entregas de EPP por colaborador"
              spacing={1.5}
              sx={{ listStyle: "none", m: 0, p: 0 }}
            >
              {rows.map((epp) => (
                <EppCard
                  key={`${manufacturingPlantId}-${epp.id}`}
                  epp={epp}
                  manufacturingPlantId={manufacturingPlantId}
                  currentUserId={currentUserId}
                  onHistoryEmptied={onHistoryDeleted}
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : (
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
              {isFirstLoad && <ListRowsSkeleton />}
              {!rows.length && !isLoading && (
                <StyledTableRow>
                  <StyledTableCell colSpan={6}>{bodyState}</StyledTableCell>
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
      )}
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
