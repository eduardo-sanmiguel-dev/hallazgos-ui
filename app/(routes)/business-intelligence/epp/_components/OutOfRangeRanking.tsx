"use client";

import { useId, useMemo, useState } from "react";

import {
  Box,
  ButtonBase,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";

import type { BiEppOutOfRangeEquipment, BiEppOutOfRangeRow } from "@interfaces";
import EmptyState from "@shared/components/EmptyState";
import StatusChip from "@shared/components/StatusChip";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TablePaginationActions from "@shared/components/TablePaginationActions";

import { formatIsoDate, formatNumber, formatPercent } from "../_lib/biEpp";
import { accentCard } from "@shared/utils/accentCard";
import {
  matchesEmployee,
  rankEmployees,
  type EmployeeRanking,
} from "../_lib/outOfRange";

const ROWS_PER_PAGE = 10;
const MAX_CHIPS = 3;

interface Props {
  rows: BiEppOutOfRangeRow[];
  equipments: BiEppOutOfRangeEquipment[];
  selectedEquipmentId: number | null;
  onSelectEquipment: (equipmentId: number | null) => void;
  onOpenEmployee: (employee: EmployeeRanking) => void;
}

// Colaboradores con más entregas fuera de rango (todos los equipos o el
// elegido en la gráfica). Clic en una fila: detalle del colaborador.
export default function OutOfRangeRanking({
  rows,
  equipments,
  selectedEquipmentId,
  onSelectEquipment,
  onOpenEmployee,
}: Props) {
  const titleId = useId();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const ranking = useMemo(
    () => rankEmployees(rows, selectedEquipmentId),
    [rows, selectedEquipmentId],
  );
  const filtered = ranking.filter((employee) =>
    matchesEmployee(employee, search),
  );
  // Al filtrar, la página actual puede quedar fuera de rango.
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / ROWS_PER_PAGE) - 1),
  );
  const visible = filtered.slice(
    currentPage * ROWS_PER_PAGE,
    (currentPage + 1) * ROWS_PER_PAGE,
  );
  const selectedName = equipments.find(
    (equipment) => equipment.equipmentId === selectedEquipmentId,
  )?.equipmentName;

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={(theme) => ({
        p: { xs: 1.5, sm: 2 },
        minWidth: 0,
        ...accentCard(theme),
      })}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography
          id={titleId}
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 600, lineHeight: 1.3 }}
        >
          Colaboradores con más entregas fuera de rango
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedName
            ? `Entregas de ${selectedName} fuera de rango.`
            : "Todos los equipos."}{" "}
          Haz clic en un colaborador para ver qué equipos pide fuera de rango.
        </Typography>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          label="Buscar colaborador"
          placeholder="Nombre o cédula"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: 1, maxWidth: { sm: 320 } }}
        />
        <TextField
          select
          size="small"
          label="Equipo"
          value={selectedEquipmentId ?? ""}
          onChange={(event) => {
            onSelectEquipment(
              event.target.value === "" ? null : Number(event.target.value),
            );
            setPage(0);
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todos los equipos</MenuItem>
          {equipments.map(({ equipmentId, equipmentName }) => (
            <MenuItem key={equipmentId} value={equipmentId}>
              {equipmentName}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {!filtered.length ? (
        <Box sx={{ py: 4 }}>
          <EmptyState
            size="small"
            title="Sin colaboradores"
            description={
              search
                ? "Ningún colaborador coincide con la búsqueda."
                : "Ninguna entrega fuera de rango en el periodo."
            }
          />
        </Box>
      ) : (
        <>
          {/* Como las tablas del sistema (encabezado verde tenue, filas
              alternadas); en celular, tarjetas como en las listas. Antes,
              una tabla con otro estilo y, en celular, de 6 columnas con
              desplazamiento lateral. */}
          {isPhone ? (
            <Stack
              component="ul"
              aria-label="Colaboradores con más entregas fuera de rango"
              spacing={1}
              sx={{ listStyle: "none", m: 0, p: 0 }}
            >
              {visible.map((employee) => (
                <Paper
                  key={employee.employeeId}
                  component="li"
                  variant="outlined"
                >
                  <ButtonBase
                    aria-label={`Ver detalle de ${employee.name}`}
                    onClick={() => onOpenEmployee(employee)}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      width: "100%",
                      p: 1.5,
                      textAlign: "left",
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {employee.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {employeeSubtitle(employee)}
                      </Typography>
                      <Stack
                        direction="row"
                        useFlexGap
                        sx={{ flexWrap: "wrap", gap: 0.5, mt: 1 }}
                      >
                        <StatusChip
                          size="small"
                          tone="warning"
                          label={`${formatNumber(employee.outOfRange)} fuera de rango · ${formatPercent(employee.percent)}`}
                        />
                        <EquipmentChips employee={employee} />
                      </Stack>
                      <Typography
                        variant="caption"
                        component="p"
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                      >
                        {[
                          employee.averageDaysEarly !== null &&
                            `${formatNumber(employee.averageDaysEarly)} días antes en promedio`,
                          `Última entrega ${formatIsoDate(employee.lastDelivery)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </Box>
                    <ChevronRightIcon
                      aria-hidden
                      sx={{ color: "text.secondary", mt: 0.25 }}
                    />
                  </ButtonBase>
                </Paper>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-labelledby={titleId}>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Colaborador</StyledTableCell>
                    <StyledTableCell align="right">
                      Fuera de rango
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      % de sus entregas
                    </StyledTableCell>
                    <StyledTableCell>Equipos</StyledTableCell>
                    <StyledTableCell align="right">
                      Anticipación promedio
                    </StyledTableCell>
                    <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                      Última entrega
                    </StyledTableCell>
                    {/* Flecha: la fila abre el detalle. */}
                    <StyledTableCell aria-hidden sx={{ width: 40 }} />
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {visible.map((employee) => (
                    <StyledTableRow
                      key={employee.employeeId}
                      hover
                      tabIndex={0}
                      aria-label={`Ver detalle de ${employee.name}`}
                      onClick={() => onOpenEmployee(employee)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenEmployee(employee);
                        }
                      }}
                      sx={{ cursor: "pointer" }}
                    >
                      <StyledTableCell component="th" scope="row">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {employee.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employeeSubtitle(employee)}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell
                        align="right"
                        sx={{
                          fontVariantNumeric: "tabular-nums",
                          fontWeight: 600,
                        }}
                      >
                        {formatNumber(employee.outOfRange)}
                      </StyledTableCell>
                      <StyledTableCell
                        align="right"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatPercent(employee.percent)}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack
                          direction="row"
                          useFlexGap
                          sx={{ flexWrap: "wrap", gap: 0.5 }}
                        >
                          <EquipmentChips employee={employee} />
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell
                        align="right"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {employee.averageDaysEarly === null
                          ? "—"
                          : `${formatNumber(employee.averageDaysEarly)} días`}
                      </StyledTableCell>
                      <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatIsoDate(employee.lastDelivery)}
                      </StyledTableCell>
                      <StyledTableCell sx={{ px: 1 }}>
                        <ChevronRightIcon
                          aria-hidden
                          fontSize="small"
                          sx={{ display: "block", color: "text.secondary" }}
                        />
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
            ActionsComponent={TablePaginationActions}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        </>
      )}
    </Paper>
  );
}

const employeeSubtitle = (employee: EmployeeRanking) =>
  [employee.code && `Cédula ${employee.code}`, employee.area]
    .filter(Boolean)
    .join(" · ");

/** Equipos que pide fuera de rango (los primeros y "+N"). */
function EquipmentChips({ employee }: { employee: EmployeeRanking }) {
  return (
    <>
      {employee.equipments.slice(0, MAX_CHIPS).map(({ name, count }) => (
        <StatusChip
          key={name}
          size="small"
          variant="outlined"
          label={`${name} ×${count}`}
        />
      ))}
      {employee.equipments.length > MAX_CHIPS && (
        <StatusChip
          size="small"
          label={`+${employee.equipments.length - MAX_CHIPS}`}
        />
      )}
    </>
  );
}
