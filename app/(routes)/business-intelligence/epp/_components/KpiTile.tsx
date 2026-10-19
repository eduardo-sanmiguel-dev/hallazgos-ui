import { ReactNode } from "react";

import { Box, Paper, Skeleton, Typography } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import RemoveIcon from "@mui/icons-material/Remove";

import { formatNumber } from "../_lib/biEpp";

// Qué significa que el valor suba: "good" (verde), "bad" (rojo) o "neutral".
type Polarity = "good" | "bad" | "neutral";

export interface KpiDelta {
  current: number;
  previous: number;
  // "relative": variación % (montos, cantidades). "points": diferencia en
  // puntos porcentuales (para indicadores que ya son %).
  mode: "relative" | "points";
  polarity: Polarity;
  comparedTo: string;
}

interface Props {
  label: string;
  value: string;
  caption?: ReactNode;
  delta?: KpiDelta;
  isLoading?: boolean;
}

const deltaText = ({ current, previous, mode }: KpiDelta) => {
  if (mode === "points") {
    const diff = current - previous;
    return { diff, text: `${formatNumber(Math.abs(diff), 1)} pts` };
  }

  if (!previous)
    return { diff: current, text: current ? "nuevo" : "sin cambio" };

  const diff = ((current - previous) / previous) * 100;
  return { diff, text: `${formatNumber(Math.abs(diff), 1)}%` };
};

function DeltaRow({ delta }: { delta: KpiDelta }) {
  const { diff, text } = deltaText(delta);
  const direction = Math.abs(diff) < 0.05 ? 0 : Math.sign(diff);

  const tone =
    direction === 0 || delta.polarity === "neutral"
      ? "text.secondary"
      : direction > 0 === (delta.polarity === "good")
        ? "success.main"
        : "error.main";

  const Icon =
    direction > 0
      ? ArrowDropUpIcon
      : direction < 0
        ? ArrowDropDownIcon
        : RemoveIcon;

  const verb = direction > 0 ? "Subió" : direction < 0 ? "Bajó" : "Sin cambio";

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: 24 }}
      aria-label={`${verb} ${direction === 0 ? "" : text} contra ${delta.comparedTo}`}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          color: tone,
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
      >
        <Icon fontSize="small" aria-hidden />
        {direction === 0 ? "Sin cambio" : text}
      </Box>
      <Typography variant="caption" color="text.secondary" noWrap>
        vs {delta.comparedTo}
      </Typography>
    </Box>
  );
}

// Indicador principal: un número, su variación y contexto.
export default function KpiTile({
  label,
  value,
  caption,
  delta,
  isLoading,
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {label}
      </Typography>
      {isLoading ? (
        <>
          <Skeleton variant="text" width="60%" sx={{ fontSize: "2rem" }} />
          <Skeleton variant="text" width="80%" />
        </>
      ) : (
        <>
          <Typography
            component="p"
            sx={{
              fontSize: { xs: "1.75rem", md: "2rem" },
              fontWeight: 600,
              lineHeight: 1.15,
              color: "text.primary",
            }}
          >
            {value}
          </Typography>
          {delta && <DeltaRow delta={delta} />}
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </>
      )}
    </Paper>
  );
}
