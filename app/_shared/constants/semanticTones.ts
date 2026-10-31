import {
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";

// Colores semánticos del sistema. Son nombres de la paleta de MUI, así que
// respetan el tema elegido (claro, oscuro) y el contraste AA del
// tema claro (ver app/theme.tsx).
export type SemanticTone = "success" | "warning" | "info" | "error" | "default";

export const STATUS_CANCELLED = "Cancelado";

// Estatus de un hallazgo (tono semántico, para lo que use la paleta de MUI).
// Cancelado es neutro: ya no requiere nada; el rojo queda para lo urgente
// (plazo vencido, prioridad inmediata).
export const EVIDENCE_STATUS_TONE: Record<string, SemanticTone> = {
  [STATUS_OPEN]: "warning",
  [STATUS_IN_PROGRESS]: "info",
  [STATUS_CLOSED]: "success",
  [STATUS_CANCELLED]: "default",
};

/**
 * Colores de los estatus de un hallazgo en todo el sistema (chips, filtros,
 * gráficas, seguimiento y correos; el API tiene los mismos en
 * mail/mail.view.ts). `main`: relleno con texto blanco (AA) y texto o ícono
 * sobre fondo claro; `light`: texto o ícono sobre fondo oscuro.
 */
export const EVIDENCE_STATUS_COLOR: Record<
  string,
  { main: string; light: string }
> = {
  [STATUS_OPEN]: { main: "#B45309", light: "#FBBF24" },
  [STATUS_IN_PROGRESS]: { main: "#1D4ED8", light: "#93C5FD" },
  [STATUS_CLOSED]: { main: "#15803D", light: "#4ADE80" },
  [STATUS_CANCELLED]: { main: "#6B7280", light: "#D1D5DB" },
};

/** Color de un estatus para texto o ícono según el modo del tema. */
export const evidenceStatusColor = (
  status: string,
  mode: "light" | "dark" = "light",
) => {
  const color = EVIDENCE_STATUS_COLOR[status];
  if (!color) return undefined;
  return mode === "dark" ? color.light : color.main;
};

export const evidenceStatusTone = (status: string): SemanticTone =>
  EVIDENCE_STATUS_TONE[status] ?? "default";

// Nivel de riesgo, con los nombres que manda el API en el dashboard.
export const RISK_LEVEL_TONE: Record<string, SemanticTone> = {
  Bajo: "success",
  Medio: "info",
  Alto: "warning",
  Critico: "error",
};

export const riskLevelTone = (level: string): SemanticTone =>
  RISK_LEVEL_TONE[level] ?? "default";

// Plazo de atención: vencido (abierto) o cerrado fuera de tiempo es error;
// cerrado en tiempo es éxito.
export type DeadlineState = "overdue" | "onTime" | "late";

export const DEADLINE_TONE: Record<DeadlineState, SemanticTone> = {
  overdue: "error",
  onTime: "success",
  late: "error",
};
