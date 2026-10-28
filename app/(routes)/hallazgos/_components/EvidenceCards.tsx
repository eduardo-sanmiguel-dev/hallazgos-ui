import { MouseEvent, useState } from "react";

import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { IconButton } from "@mui/material";
import { Link } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { TablePagination } from "@mui/material";
import { Typography } from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";

import { constants } from "@constants";
import { EvidenceGraphql } from "@hooks";
import { EvidenceStatusChip } from "@shared/components/StatusChip";
import { TableBodyState } from "@shared/components/TableDefaultServer";
import TablePaginationActions from "@shared/components/TablePaginationActions";
import { getDeadline } from "@routes/hallazgos/_constants/priorityOptions";
import EvidenceDeadline from "./EvidenceDeadline";
import type { EvidenceActions } from "./useEvidenceActions";

export const responsiblesLabel = (row: EvidenceGraphql) =>
  (row.responsibles.length > 0 ? row.responsibles : row.supervisors)
    .map((person) => person.name)
    .join(", ");

interface Props {
  rows: EvidenceGraphql[];
  actions: EvidenceActions;
  onDetails: (row: EvidenceGraphql) => void;
  onStart: (row: EvidenceGraphql) => void;
  onClose: (row: EvidenceGraphql) => void;
  onReassign: (row: EvidenceGraphql) => void;
  onCancel: (row: EvidenceGraphql) => void;
  isBusy?: boolean;
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  count: number;
}

// Lista de hallazgos en celular (C1): en la tabla, el estatus y las acciones
// quedaban fuera de la pantalla. Cada tarjeta muestra lo necesario para
// decidir en campo y la acción principal (Iniciar o Cerrar) a la vista; el
// resto de las acciones van en "Más acciones".
export default function EvidenceCards({
  rows,
  actions,
  onDetails,
  onStart,
  onClose,
  onReassign,
  onCancel,
  isBusy = false,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  count,
}: Props) {
  const [menu, setMenu] = useState<{
    anchor: HTMLElement;
    row: EvidenceGraphql;
  } | null>(null);

  const openMenu = (event: MouseEvent<HTMLElement>, row: EvidenceGraphql) =>
    setMenu({ anchor: event.currentTarget, row });

  const closeMenu = () => setMenu(null);

  // Del menú: se cierra antes de abrir el diálogo de la acción.
  const fromMenu = (action: (row: EvidenceGraphql) => void) => () => {
    const row = menu?.row;
    closeMenu();
    if (row) action(row);
  };

  const menuRow = menu?.row;
  // La acción principal no se repite en el menú.
  const menuShowsClose =
    !!menuRow && actions.canClose(menuRow) && actions.canStart(menuRow);

  return (
    <Box>
      {rows.length === 0 ? (
        <Paper variant="outlined">
          <TableBodyState />
        </Paper>
      ) : (
        <Stack
          component="ul"
          aria-label="Hallazgos"
          spacing={1.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {rows.map((row) => {
            const primary = actions.canStart(row)
              ? "start"
              : actions.canClose(row)
                ? "close"
                : null;
            const responsibles = responsiblesLabel(row);

            return (
              <Paper
                key={row.id}
                component="li"
                variant="outlined"
                aria-label={`Hallazgo ${row.id}`}
                sx={{ p: 2, cursor: "pointer" }}
                // Como en la tabla: tocar la tarjeta abre el detalle, salvo
                // en sus botones.
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest("button, a, [role='button']")) return;
                  onDetails(row);
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Link
                    component="button"
                    variant="subtitle1"
                    underline="hover"
                    onClick={() => onDetails(row)}
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    Hallazgo #{row.id}
                  </Link>
                  <EvidenceStatusChip status={row.status} size="small" />
                </Stack>

                <Typography
                  variant="body2"
                  component="p"
                  sx={{ mt: 0.5, fontWeight: 600, overflowWrap: "anywhere" }}
                >
                  {row.secondaryType.name}
                </Typography>

                <Box
                  component="dl"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(96px, auto) 1fr",
                    columnGap: 1.5,
                    rowGap: 0.75,
                    mt: 1.5,
                    mb: 0,
                    "& dt": { color: "text.secondary", typography: "body2" },
                    "& dd": {
                      m: 0,
                      typography: "body2",
                      overflowWrap: "anywhere",
                    },
                  }}
                >
                  <dt>Lugar</dt>
                  <dd>
                    {row.zone.name}
                    {row.zone.area?.name ? ` (${row.zone.area.name})` : ""}
                  </dd>
                  <dt>Responsable</dt>
                  <dd>{responsibles || "-"}</dd>
                  {getDeadline(row) && (
                    <>
                      <dt>Plazo</dt>
                      <dd>
                        <EvidenceDeadline deadline={getDeadline(row)} />
                      </dd>
                    </>
                  )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  {primary && (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        primary === "start" ? (
                          <PlayCircleOutlineIcon />
                        ) : (
                          <AddAPhotoIcon />
                        )
                      }
                      onClick={() =>
                        primary === "start" ? onStart(row) : onClose(row)
                      }
                    >
                      {primary === "start" ? "Iniciar" : "Cerrar"}
                    </Button>
                  )}
                  <IconButton
                    aria-label={`Más acciones del hallazgo ${row.id}`}
                    aria-haspopup="menu"
                    onClick={(event) => openMenu(event, row)}
                    sx={{ ml: primary ? 0 : "auto" }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <Menu
        anchorEl={menu?.anchor}
        open={!!menu}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={fromMenu(onDetails)}>
          <ListItemIcon sx={{ color: "text.brand" }}>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
        </MenuItem>
        {menuShowsClose && (
          <MenuItem onClick={fromMenu(onClose)}>
            <ListItemIcon sx={{ color: "warning.main" }}>
              <AddAPhotoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cerrar hallazgo</ListItemText>
          </MenuItem>
        )}
        {menuRow && actions.canReassign(menuRow) && (
          <MenuItem onClick={fromMenu(onReassign)}>
            <ListItemIcon sx={{ color: "success.main" }}>
              <PersonAddAlt1Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reasignar</ListItemText>
          </MenuItem>
        )}
        {menuRow && actions.canCancel(menuRow) && (
          <MenuItem onClick={fromMenu(onCancel)} disabled={isBusy}>
            <ListItemIcon sx={{ color: "error.main" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Cancelar</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <TablePagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={constants.pagination.rowsPerPageOptions}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        ActionsComponent={TablePaginationActions}
      />
    </Box>
  );
}
