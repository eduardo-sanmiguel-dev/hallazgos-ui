import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";

import { Chip } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { Stack } from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import IconButton from "@mui/material/IconButton";

import { durantionToTime, notify, stringToDateWithTime } from "@shared/utils";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import {
  ROLE_ADMINISTRADOR,
  ROLE_SUPERVISOR,
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";
import EvidencePreview from "./EvidencePreview";
import CloseEvidence from "./CloseEvidence";
import StartProcessEvidence from "./StartProcessEvidence";
import ReassignResponsiblesEvidence from "./ReassignResponsiblesEvidence";
import { useUserSessionStore } from "@store";
import { EvidencesService } from "@services";
import { EvidenceGraphql } from "@hooks";
import TableDefaultServer from "@shared/components/TableDefaultServer";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  formatDayLabel,
  getPriorityLabel,
  getRemainingDays,
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
  "Prioridad y \nTiempo restante (días)",
  "FR: fecha de registro\nFA: fecha de actualización\nFC: fecha de cierre",
  "Acciones",
];

interface Props {
  rows: EvidenceGraphql[];
  getData: () => void;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
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
  const [supervisorOverrideEmails, setSupervisorOverrideEmails] = useState<
    string[]
  >([]);
  const [cancelEvidenceEmails, setCancelEvidenceEmails] = useState<string[]>(
    [],
  );
  const [evidenceReassignCurrent, setEvidenceReassignCurrent] =
    useState<EvidenceGraphql | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRowId, setMenuRowId] = useState<number | null>(null);
  const { id: userId, role, email } = useUserSessionStore();

  useEffect(() => {
    EvidencesService.getPermissionsConfig()
      .then((config) => {
        setSupervisorOverrideEmails(config.supervisorOverrideEmails || []);
        setCancelEvidenceEmails(config.cancelEvidenceEmails || []);
      })
      .catch(() => {
        setSupervisorOverrideEmails([]);
        setCancelEvidenceEmails([]);
      });
  }, []);

  const removeEvicence = (id: number) => {
    setIsLoading(true);
    EvidencesService.remove(id)
      .then(() => {
        notify("Hallazgo eliminado correctamente", true);
        getData();
      })
      .finally(() => setIsLoading(false));
  };

  const confirmRemoveEvidence = (row: EvidenceGraphql) => {
    toast.warning("Confirmar cancelación", {
      description: `¿Desea cancelar/eliminar el hallazgo #${row.id}?`,
      duration: 10000,
      cancel: {
        label: "Cancelar",
        onClick: () => undefined,
      },
      action: {
        label: "Cancelar",
        onClick: () => removeEvicence(row.id),
      },
    });
  };

  // !Atention: Force close evidence if the user is a supervisor
  const validateSupervisor = (row: EvidenceGraphql) => {
    if (supervisorOverrideEmails.includes(email)) {
      return true;
    }
    return (
      row.status === STATUS_OPEN &&
      role === ROLE_SUPERVISOR &&
      (row.supervisors
        .map((supervisor) => Number(supervisor.id))
        .includes(userId) ||
        row.responsibles
          .map((responsible) => Number(responsible.id))
          .includes(userId))
    );
  };

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

  const canReassignEvidence = (row: EvidenceGraphql) => {
    if (role === ROLE_ADMINISTRADOR) {
      return true;
    }

    if (supervisorOverrideEmails.includes(email)) {
      return true;
    }

    const isSupervisorAssigned = row.supervisors.some(
      (supervisor) => Number(supervisor.id) === Number(userId),
    );

    const isResponsibleAssigned = row.responsibles.some(
      (responsible) => Number(responsible.id) === Number(userId),
    );

    return isSupervisorAssigned || isResponsibleAssigned;
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

      <TableDefaultServer
        rows={rows}
        columns={columns}
        paintRows={(row: EvidenceGraphql) => (
          <StyledTableRow key={row.id}>
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
              title={
                row.responsibles.length > 0
                  ? row.responsibles
                      .map((responsible) => responsible.name)
                      .join(", ")
                  : row.supervisors
                      .map((supervisor) => supervisor.name)
                      .join(", ")
              }
            >
              {row.responsibles.length > 0
                ? row.responsibles
                    .map((responsible) => responsible.name)
                    .join(", ")
                : row.supervisors
                    .map((supervisor) => supervisor.name)
                    .join(", ")}
            </StyledTableCell>
            <StyledTableCell>
              <Chip
                icon={
                  row.status === STATUS_OPEN ? (
                    <HourglassEmptyIcon />
                  ) : row.status === STATUS_CLOSED ? (
                    <CheckCircleOutlineIcon />
                  ) : row.status === STATUS_IN_PROGRESS ? (
                    <PendingActionsIcon />
                  ) : (
                    <CancelOutlinedIcon />
                  )
                }
                label={row.status}
                color={
                  row.status === STATUS_OPEN
                    ? "warning"
                    : row.status === STATUS_CLOSED
                      ? "success"
                      : row.status === STATUS_IN_PROGRESS
                        ? "info"
                        : "error"
                }
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
                      <Chip
                        label="Vencido"
                        color="error"
                        size="small"
                        sx={{ mt: 0.25 }}
                      />
                    );
                  }

                  return null;
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
                <span>
                  <b>FA:</b> {stringToDateWithTime(row.updatedAt)}
                </span>
                <span>
                  <b>FC:</b>{" "}
                  {row.solutionDate
                    ? stringToDateWithTime(row.solutionDate)
                    : "-"}
                </span>
              </Stack>
            </StyledTableCell>
            <StyledTableCell>
              <IconButton
                size="small"
                onClick={(event) => openActionsMenu(event, row.id)}
              >
                <MoreVertIcon />
              </IconButton>

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
                  <ListItemIcon sx={{ color: "primary.main" }}>
                    {row.status === STATUS_CLOSED ? (
                      <AccessTimeIcon fontSize="small" />
                    ) : (
                      <InfoIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText>
                    {row.status === STATUS_CLOSED
                      ? `${durantionToTime(row)}`
                      : "Ver detalles"}
                  </ListItemText>
                </MenuItem>

                {(role === ROLE_ADMINISTRADOR || validateSupervisor(row)) &&
                  row.status === STATUS_OPEN &&
                  !row.imgProcess && (
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

                {validateSupervisor(row) && row.status !== STATUS_CLOSED && (
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

                {canReassignEvidence(row) && row.status !== STATUS_CLOSED && (
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

                {row.status === STATUS_OPEN &&
                  (role === ROLE_ADMINISTRADOR ||
                    cancelEvidenceEmails.includes(email)) && (
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
    </>
  );
}
