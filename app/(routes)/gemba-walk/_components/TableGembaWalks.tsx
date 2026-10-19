import { useRouter } from "next/navigation";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";

import { stringToDateWithTime } from "@shared/utils";
import { RowActions, ViewAction } from "@shared/components/RowActions";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer, {
  type ServerPagination,
} from "@shared/components/TableDefaultServer";
import { GembaWalk } from "@interfaces";
import { formatDuration } from "./formatDuration";

interface Props {
  rows: GembaWalk[];
  pagination: ServerPagination;
}

const columns = [
  "ID",
  "Planta",
  "Zona",
  "Ubicación",
  "Programado",
  "Adicional",
  "Realizado",
  "Duración",
  "Resultado",
  "Cumplimiento",
  "Observador",
  "Acciones",
];

export const complianceOf = (gembaWalk: GembaWalk) => {
  const total = gembaWalk.results?.length || 0;
  const compliant =
    gembaWalk.results?.filter(({ isCompliant }) => isCompliant).length || 0;

  return {
    total,
    compliant,
    nonCompliant: total - compliant,
    percent: total ? Math.round((compliant / total) * 100) : 0,
  };
};

export default function TableGembaWalks({ rows, pagination }: Props) {
  const router = useRouter();

  return (
    <TableDefaultServer
      rows={rows}
      columns={columns}
      {...pagination}
      paintRows={(row: GembaWalk) => {
        const { compliant, nonCompliant, percent } = complianceOf(row);
        const zone = row.gembaWalkCalendar?.gembaWalkZone;

        return (
          <StyledTableRow key={row.id}>
            <StyledTableCell component="th" scope="row">
              {row.id}
            </StyledTableCell>
            <StyledTableCell>
              {zone?.manufacturingPlant?.name || "-"}
            </StyledTableCell>
            <StyledTableCell>{zone?.nameZone || "-"}</StyledTableCell>
            <StyledTableCell>{zone?.nameLocation || "-"}</StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.gembaWalkCalendar.scheduledAt)}
            </StyledTableCell>
            <StyledTableCell>
              {row.gembaWalkCalendar.isAdditional ? "Sí" : "No"}
            </StyledTableCell>
            <StyledTableCell>
              {stringToDateWithTime(row.performedAt)}
            </StyledTableCell>
            <StyledTableCell>
              {formatDuration(row.durationSeconds)}
            </StyledTableCell>
            <StyledTableCell>
              <Stack direction="row" spacing={1}>
                <Chip size="small" color="success" label={`C: ${compliant}`} />
                <Chip
                  size="small"
                  color={nonCompliant ? "error" : "default"}
                  label={`NC: ${nonCompliant}`}
                />
              </Stack>
            </StyledTableCell>
            <StyledTableCell>{percent}%</StyledTableCell>
            <StyledTableCell>{row.createdBy?.name || "-"}</StyledTableCell>
            <StyledTableCell>
              <RowActions>
                <ViewAction
                  onClick={() => router.push("/gemba-walk/view?id=" + row.id)}
                />
              </RowActions>
            </StyledTableCell>
          </StyledTableRow>
        );
      }}
    />
  );
}
