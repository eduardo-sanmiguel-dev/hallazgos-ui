"use client";

import { useId, useMemo, useState } from "react";

import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import type { BiEppOutOfRangeEquipment, BiEppOutOfRangeRow } from "@interfaces";
import EmptyState from "@shared/components/EmptyState";

import { formatIsoDate, formatNumber, formatPercent } from "../_lib/biEpp";
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
      sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}
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
          <TableContainer>
            <Table size="small" aria-labelledby={titleId}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Colaborador</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Fuera de rango
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    % de sus entregas
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Equipos</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Anticipación promedio
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    Última entrega
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((employee) => (
                  <TableRow
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
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {employee.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[
                          employee.code && `Cédula ${employee.code}`,
                          employee.area,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                      }}
                    >
                      {formatNumber(employee.outOfRange)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatPercent(employee.percent)}
                    </TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        sx={{ flexWrap: "wrap", gap: 0.5 }}
                      >
                        {employee.equipments
                          .slice(0, MAX_CHIPS)
                          .map(({ name, count }) => (
                            <Chip
                              key={name}
                              size="small"
                              variant="outlined"
                              label={`${name} ×${count}`}
                            />
                          ))}
                        {employee.equipments.length > MAX_CHIPS && (
                          <Chip
                            size="small"
                            label={`+${employee.equipments.length - MAX_CHIPS}`}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {employee.averageDaysEarly === null
                        ? "—"
                        : `${formatNumber(employee.averageDaysEarly)} días`}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatIsoDate(employee.lastDelivery)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={currentPage}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={ROWS_PER_PAGE}
            rowsPerPageOptions={[ROWS_PER_PAGE]}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        </>
      )}
    </Paper>
  );
}
