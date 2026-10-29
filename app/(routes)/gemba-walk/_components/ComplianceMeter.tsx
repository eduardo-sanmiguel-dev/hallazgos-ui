import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";

import StatusChip from "@shared/components/StatusChip";

interface Props {
  compliant: number;
  nonCompliant: number;
  // "compact": en una línea (barra fija del registro); "full": con título.
  variant?: "compact" | "full";
}

/** Porcentaje de conceptos que cumplen (0 sin conceptos). */
export const compliancePercent = (compliant: number, nonCompliant: number) => {
  const total = compliant + nonCompliant;
  return total ? Math.round((compliant / total) * 100) : 0;
};

// Cumplimiento de un recorrido: porcentaje con barra en el verde de marca y
// los conteos "C" (cumple) y "NC" (no cumple; en rojo solo si hay alguno).
// Mismos números en el registro (en vivo) y en el detalle.
export default function ComplianceMeter({
  compliant,
  nonCompliant,
  variant = "full",
}: Props) {
  const percent = compliancePercent(compliant, nonCompliant);
  const counts = (
    <Stack direction="row" spacing={1} aria-live="polite">
      <StatusChip tone="success" size="small" label={`C: ${compliant}`} />
      <StatusChip
        tone={nonCompliant ? "error" : "default"}
        size="small"
        label={`NC: ${nonCompliant}`}
      />
    </Stack>
  );

  if (variant === "compact") {
    return (
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: "center", flexWrap: "wrap", minWidth: 0 }}
      >
        {counts}
        <Box sx={{ flex: 1, minWidth: 120 }}>
          <LinearProgress
            variant="determinate"
            value={percent}
            aria-label={`Cumplimiento: ${percent}%`}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {percent}%
        </Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "baseline", justifyContent: "space-between" }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Cumplimiento
        </Typography>
        {counts}
      </Stack>
      <Typography
        component="p"
        variant="h3"
        sx={{ fontWeight: 700, lineHeight: 1.2, my: 0.5 }}
      >
        {percent}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`Cumplimiento: ${percent}%`}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
}
