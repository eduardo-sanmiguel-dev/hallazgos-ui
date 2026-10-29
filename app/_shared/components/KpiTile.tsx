import { ReactNode } from "react";

import { Box, Paper, Skeleton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import RemoveIcon from "@mui/icons-material/Remove";

import { accentCard } from "@shared/utils/accentCard";

const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

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
  // Ícono del indicador (en un círculo verde tenue, arriba a la derecha).
  icon?: ReactNode;
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
      ? "neutral"
      : direction > 0 === (delta.polarity === "good")
        ? "success"
        : "error";

  const Icon =
    direction > 0
      ? ArrowDropUpIcon
      : direction < 0
        ? ArrowDropDownIcon
        : RemoveIcon;

  const verb = direction > 0 ? "Subió" : direction < 0 ? "Bajó" : "Sin cambio";

  return (
    <Box
      // Con dos indicadores por fila (celular), "vs …" baja de renglón en
      // lugar de salirse de la tarjeta.
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 0.5,
        minHeight: 24,
      }}
      aria-label={`${verb} ${direction === 0 ? "" : text} contra ${delta.comparedTo}`}
    >
      {/* Variación en una pastilla del tono (verde, rojo o gris). */}
      <Box
        sx={(theme) => {
          const color =
            tone === "neutral"
              ? theme.palette.text.secondary
              : theme.palette[tone].main;
          return {
            display: "inline-flex",
            alignItems: "center",
            pr: 0.75,
            borderRadius: 999,
            color: tone === "neutral" ? "text.secondary" : `${tone}.main`,
            backgroundColor: alpha(color, 0.12),
            fontWeight: 600,
            fontSize: "0.8125rem",
            lineHeight: 1.6,
          };
        }}
      >
        <Icon fontSize="small" aria-hidden />
        {direction === 0 ? "Sin cambio" : text}
      </Box>
      {/* El rango ya está bajo el título de la página; aquí, corto (antes
          "vs 31 ago – 29 sep 2026" en cada indicador, dos renglones en
          celular). El rango completo, en el tooltip. */}
      <Tooltip title={`Comparado con ${delta.comparedTo}`}>
        <Typography variant="caption" color="text.secondary">
          vs periodo anterior
        </Typography>
      </Tooltip>
    </Box>
  );
}

// Indicador principal de un tablero (dashboard, análisis EPP): un número,
// su variación contra el periodo anterior y contexto.
export default function KpiTile({
  label,
  value,
  caption,
  delta,
  isLoading,
  icon,
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        ...accentCard(theme),
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          {label}
        </Typography>
        {icon && (
          <Box
            aria-hidden
            sx={(theme) => ({
              display: { xs: "none", sm: "grid" },
              placeItems: "center",
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "50%",
              color: "primary.main",
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              "& svg": { fontSize: 20 },
            })}
          >
            {icon}
          </Box>
        )}
      </Box>
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
