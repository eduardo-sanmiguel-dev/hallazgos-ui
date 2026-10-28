import { Dispatch, SetStateAction, useState } from "react";

import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Stack } from "@mui/material";
import { Tooltip } from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import IconButton from "@mui/material/IconButton";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import {
  durantionToTime,
  notify,
  stringToDateWithTime,
  updatedDateLabel,
} from "@shared/utils";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { STATUS_CLOSED } from "@shared/constants";
import EvidencePreview from "./EvidencePreview";
import CloseEvidence from "./CloseEvidence";
import StartProcessEvidence from "./StartProcessEvidence";
import ReassignResponsiblesEvidence from "./ReassignResponsiblesEvidence";
import EvidenceCards, { responsiblesLabel } from "./EvidenceCards";
import { useEvidenceActions } from "./useEvidenceActions";
import { EvidencesService } from "@services";
import { EvidenceGraphql } from "@hooks";
import TableDefaultServer from "@shared/components/TableDefaultServer";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import StatusChip, { EvidenceStatusChip } from "@shared/components/StatusChip";
import { DEADLINE_TONE } from "@shared/constants/semanticTones";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  formatDayLabel,
  getPriorityLabel,
  getRemainingDays,
  getResolutionDays,
} from "@routes/hallazgos/_constants/priorityOptions";

const columns = [
  "ID",
  "Planta",
  "Clasificación",
  "Tipo",
  "Zona",
  "Lugar",
  "Processo",
  "Creado por",
  "Responsables",
  "Estatus",
  "Prioridad y \nTiempo restante / resolución (días)",
  "FR: fecha de registro\nFA: fecha de actualización\nFC: fecha de cierre",
  "Acciones",
];

interface Props {
  rows: EvidenceGraphql[];
  getData: () => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  countEvidence: number;
}

export default function TableEvidences({
  rows,
  getData,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  countEvidence,
}: Props) {
  const [evidenceCurrent, setEvidenceCurrent] =
    useState<EvidenceGraphql | null>(null);
  const [idRow, setIdRow] = useState<number>(0);
  const [idRowProcess, setIdRowProcess] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [evidenceReassignCurrent, setEvidenceReassignCurrent] =
    useState<EvidenceGraphql | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = useState<number | null>(null);
  const actions = useEvidenceActions();
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const removeEvidence = (id: number) => {
    setIsLoading(true);
    return EvidencesService.remove(id)
      .then(() => {
        notify("Hallazgo eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  // Antes los dos botones del aviso decían "Cancelar".
  const confirmRemoveEvidence = async (row: EvidenceGraphql) => {
    await confirm({
      title: "Confirmar cancelación",
      description: `¿Desea cancelar/eliminar el hallazgo #${row.id}?`,
      confirmLabel: "Cancelar hallazgo",
      cancelLabel: "Volver",
      tone: "danger",
      action: () => removeEvidence(row.id),
    });
  };

  const isActiveStatus = actions.isActive;

  const openActionsMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    rowId: number,
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRowId(rowId);
  };

  const closeActionsMenu = () => {
    setMenuAnchorEl(null);
    setMenuRowId(null);
  };

  return (
    <>
      {idRow ? (
        <CloseEvidence
          evidenceCurrent={evidenceCurrent}
          isOpen={!!idRow}
          handleClose={(refresh) => {
            if (refresh) {
              getData();
            }
            setIdRow(0);
            setEvidenceCurrent(null);
          }}
          idRow={idRow}
        />
      ) : (
        <EvidencePreview
          evidenceCurrent={evidenceCurrent}
          handleClose={(refreshData) => {
            if (refreshData) {
              getData();
            }
            setEvidenceCurrent(null);
          }}
        />
      )}

      <StartProcessEvidence
        // Por hallazgo: sin key, la foto elegida para uno seguía al abrir otro.
        key={idRowProcess}
        isOpen={!!idRowProcess}
        idRow={idRowProcess}
        handleClose={(refresh) => {
          if (refresh) {
            getData();
          }
          setIdRowProcess(0);
        }}
      />

      <ReassignResponsiblesEvidence
        isOpen={!!evidenceReassignCurrent}
        evidenceCurrent={evidenceReassignCurrent}
        handleClose={(refresh) => {
          if (refresh) {
            getData();
          }
          setEvidenceReassignCurrent(null);
        }}
      />

      {isPhone ? (
        <EvidenceCards
          rows={rows}
          actions={actions}
          onDetails={(row) => setEvidenceCurrent(row)}
          onStart={(row) => setIdRowProcess(row.id)}
          onClose={(row) => {
            setIdRow(row.id);
            setEvidenceCurrent(row);
          }}
          onReassign={(row) => setEvidenceReassignCurrent(row)}
          onCancel={(row) => confirmRemoveEvidence(row)}
          isBusy={isLoading}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={countEvidence}
        />
      ) : (
        <TableDefaultServer
          rows={rows}
          columns={columns}
          paintRows={(row: EvidenceGraphql) => (
            <StyledTableRow
              key={row.id}
              hover
              sx={{ cursor: "pointer" }}
              // RUM mostraba clics "muertos" en las filas: se esperaba que
              // abrieran el detalle. Se ignoran los clics en controles propios
              // (chip, menú de acciones y sus portales) y al seleccionar texto.
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (!event.currentTarget.contains(target)) return;
                if (target.closest("button, a, input, [role='button']")) return;
                if (window.getSelection()?.toString()) return;
                setEvidenceCurrent(row);
              }}
            >
              <StyledTableCell
                component="th"
                scope="row"
                sx={{
                  width: 70,
                  minWidth: 70,
                  maxWidth: 70,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row.id}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.manufacturingPlant.name}
              >
                {row.manufacturingPlant.name}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.mainType.name}
              >
                {row.mainType.name}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.secondaryType.name}
              >
                {row.secondaryType.name}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.zone.area?.name || "Sin zona"}
              >
                {row.zone.area?.name || "Sin zona"}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.zone.name}
              >
                {row.zone.name}
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={row.process?.name}
              >
                {row.process?.name}
              </StyledTableCell>
              <StyledTableCell>{row.user.name}</StyledTableCell>
              <StyledTableCell
                sx={{
                  width: 120,
                  minWidth: 120,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={responsiblesLabel(row)}
              >
                {responsiblesLabel(row)}
              </StyledTableCell>
              <StyledTableCell>
                <EvidenceStatusChip
                  status={row.status}
                  onClick={() => setEvidenceCurrent(row)}
                  clickable
                />
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  minWidth: 180,
                  width: 180,
                  maxWidth: 220,
                }}
              >
                <Stack
                  spacing={0.4}
                  sx={{
                    alignItems: "flex-start",
                    "& > span": {
                      whiteSpace: "nowrap",
                      lineHeight: 1.35,
                    },
                  }}
                >
                  {(() => {
                    const priorityLabel = getPriorityLabel(row.priorityDays);

                    if (priorityLabel === "Sin prioridad") {
                      return null;
                    }

                    return (
                      <span>
                        <b>Prioridad:</b> {priorityLabel}
                      </span>
                    );
                  })()}
                  {(() => {
                    if (row.status === STATUS_CLOSED) {
                      return null;
                    }

                    const remainingDays = getRemainingDays(
                      row.createdAt,
                      row.priorityDays,
                    );
                    const remainingDaysNumber = Number(remainingDays);

                    if (remainingDays === "N/A") {
                      return null;
                    }

                    if (!Number.isNaN(remainingDaysNumber)) {
                      return (
                        <span>
                          <b>Tiempo restante:</b>{" "}
                          {formatDayLabel(remainingDaysNumber)}
                        </span>
                      );
                    }

                    return (
                      <span>
                        <b>Tiempo restante:</b> {remainingDays}
                      </span>
                    );
                  })()}
                  {(() => {
                    if (row.status === STATUS_CLOSED) {
                      return null;
                    }

                    const remainingDays = getRemainingDays(
                      row.createdAt,
                      row.priorityDays,
                    );
                    const remainingDaysNumber = Number(remainingDays);

                    if (
                      remainingDays !== "N/A" &&
                      !Number.isNaN(remainingDaysNumber) &&
                      remainingDaysNumber < 0
                    ) {
                      return (
                        <StatusChip
                          label="Vencido"
                          tone={DEADLINE_TONE.overdue}
                          size="small"
                          sx={{ mt: 0.25 }}
                        />
                      );
                    }

                    return null;
                  })()}
                  {(() => {
                    if (row.status !== STATUS_CLOSED) {
                      return null;
                    }

                    const resolution = getResolutionDays(
                      row.createdAt,
                      row.solutionDate,
                      row.priorityDays,
                    );
                    // Tiempo exacto (antes solo en el menú de acciones).
                    const duration = durantionToTime(row);

                    return (
                      <>
                        {resolution && (
                          <span>
                            <b>Resuelto en:</b>{" "}
                            {formatDayLabel(resolution.days)}
                          </span>
                        )}
                        {duration && (
                          <span>
                            <b>Duración:</b> {duration}
                          </span>
                        )}
                        {resolution && resolution.isOnTime !== null && (
                          <StatusChip
                            label={
                              resolution.isOnTime
                                ? "En tiempo"
                                : `Fuera de tiempo (${formatDayLabel(resolution.daysLate)})`
                            }
                            tone={
                              DEADLINE_TONE[
                                resolution.isOnTime ? "onTime" : "late"
                              ]
                            }
                            size="small"
                            sx={{ mt: 0.25 }}
                          />
                        )}
                      </>
                    );
                  })()}
                </Stack>
              </StyledTableCell>
              <StyledTableCell
                sx={{
                  minWidth: 260,
                  width: 260,
                  maxWidth: 300,
                }}
              >
                <Stack
                  spacing={0.25}
                  sx={{
                    alignItems: "flex-start",
                    "& > span": {
                      whiteSpace: "nowrap",
                      lineHeight: 1.35,
                    },
                  }}
                >
                  <span>
                    <b>FR:</b> {stringToDateWithTime(row.createdAt)}
                  </span>
                  {/* Sin FA si no se ha editado (igual a FR). */}
                  {updatedDateLabel(row.createdAt, row.updatedAt) && (
                    <span>
                      <b>FA:</b>{" "}
                      {updatedDateLabel(row.createdAt, row.updatedAt)}
                    </span>
                  )}
                  <span>
                    <b>FC:</b>{" "}
                    {row.solutionDate
                      ? stringToDateWithTime(row.solutionDate)
                      : "-"}
                  </span>
                </Stack>
              </StyledTableCell>
              <StyledTableCell>
                {/* Cerrado y Cancelado ya no tienen acciones: el ojo deja claro
                  que solo queda consultar el detalle. */}
                {!isActiveStatus(row) ? (
                  <Tooltip title="Ver detalles">
                    <IconButton
                      size="small"
                      aria-label={`Ver detalles del hallazgo ${row.id}`}
                      onClick={() => setEvidenceCurrent(row)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <IconButton
                    size="small"
                    aria-label={`Acciones del hallazgo ${row.id}`}
                    aria-haspopup="menu"
                    onClick={(event) => openActionsMenu(event, row.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                )}

                <Menu
                  anchorEl={menuAnchorEl}
                  open={menuRowId === row.id && Boolean(menuAnchorEl)}
                  onClose={closeActionsMenu}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                >
                  <MenuItem
                    onClick={() => {
                      closeActionsMenu();
                      setEvidenceCurrent(row);
                    }}
                  >
                    <ListItemIcon sx={{ color: "text.brand" }}>
                      <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Ver detalles</ListItemText>
                  </MenuItem>

                  {actions.canStart(row) && (
                    <MenuItem
                      onClick={() => {
                        closeActionsMenu();
                        setIdRowProcess(row.id);
                      }}
                    >
                      <ListItemIcon sx={{ color: "info.main" }}>
                        <PlayCircleOutlineIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>En progreso</ListItemText>
                    </MenuItem>
                  )}

                  {actions.canClose(row) && (
                    <MenuItem
                      onClick={() => {
                        closeActionsMenu();
                        setIdRow(row.id);
                        setEvidenceCurrent(row);
                      }}
                    >
                      <ListItemIcon sx={{ color: "warning.main" }}>
                        <AddAPhotoIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Cerrar hallazgo</ListItemText>
                    </MenuItem>
                  )}

                  {actions.canReassign(row) && (
                    <MenuItem
                      onClick={() => {
                        closeActionsMenu();
                        setEvidenceReassignCurrent(row);
                      }}
                    >
                      <ListItemIcon sx={{ color: "success.main" }}>
                        <PersonAddAlt1Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Reasignar</ListItemText>
                    </MenuItem>
                  )}

                  {actions.canCancel(row) && (
                    <MenuItem
                      onClick={() => {
                        closeActionsMenu();
                        confirmRemoveEvidence(row);
                      }}
                      disabled={isLoading}
                    >
                      <ListItemIcon sx={{ color: "error.main" }}>
                        <DeleteIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Cancelar</ListItemText>
                    </MenuItem>
                  )}
                </Menu>
              </StyledTableCell>
            </StyledTableRow>
          )}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={countEvidence}
        />
      )}
      {confirmDialog}
    </>
  );
}
