import {
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";

// Colores semánticos del sistema. Son nombres de la paleta de MUI, así que
// respetan el tema elegido (claro, oscuro, halloween) y el contraste AA del
// tema claro (ver app/theme.tsx).
export type SemanticTone = "success" | "warning" | "info" | "error" | "default";

export const STATUS_CANCELLED = "Cancelado";

// Estatus de un hallazgo.
export const EVIDENCE_STATUS_TONE: Record<string, SemanticTone> = {
  [STATUS_OPEN]: "warning",
  [STATUS_IN_PROGRESS]: "info",
  [STATUS_CLOSED]: "success",
  [STATUS_CANCELLED]: "error",
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
