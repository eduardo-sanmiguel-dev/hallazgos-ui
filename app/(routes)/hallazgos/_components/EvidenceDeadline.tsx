import { Stack, Typography } from "@mui/material";

import StatusChip from "@shared/components/StatusChip";
import { DEADLINE_TONE } from "@shared/constants/semanticTones";
import {
  Deadline,
  formatDayLabel,
} from "@routes/hallazgos/_constants/priorityOptions";

// Plazo de un hallazgo (tarjetas de celular y detalle), con los mismos tonos
// que la tabla: vencido o cerrado fuera de tiempo en rojo, en tiempo en verde.
export default function EvidenceDeadline({
  deadline,
}: {
  deadline: Deadline | null;
}) {
  if (!deadline) return null;

  if (deadline.state === "remaining") {
    return (
      <Typography variant="body2">
        {deadline.days === 0
          ? "Vence hoy"
          : `Quedan ${formatDayLabel(deadline.days)}`}
      </Typography>
    );
  }

  if (deadline.state === "overdue") {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <StatusChip label="Vencido" tone={DEADLINE_TONE.overdue} size="small" />
        <Typography variant="body2">
          hace {formatDayLabel(deadline.days)}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ alignItems: "center", flexWrap: "wrap" }}
    >
      <Typography variant="body2">
        Resuelto en {formatDayLabel(deadline.days)}
      </Typography>
      {deadline.isOnTime !== null && (
        <StatusChip
          label={
            deadline.isOnTime
              ? "En tiempo"
              : `Fuera de tiempo (${formatDayLabel(deadline.daysLate)})`
          }
          tone={DEADLINE_TONE[deadline.isOnTime ? "onTime" : "late"]}
          size="small"
        />
      )}
    </Stack>
  );
}
