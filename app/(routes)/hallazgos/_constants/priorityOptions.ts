import {
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";

// Único mapeo de prioridad de la UI (formulario, tabla, detalle y gráficas
// del dashboard). Se guardan solo los días; el API usa el mismo mapeo en
// hallazgos-api/src/shared/constants/priority.ts. Hasta el 26-jun-2026
// "Inmediato" era 8 días: los hallazgos de antes conservan sus días y pueden
// mostrar otra etiqueta (docs/ux-auditoria.md, sección 5).
export const priorityOptions = [
  { name: "Inmediato", days: 2, riskLevel: "Critico" },
  { name: "Corto plazo", days: 8, riskLevel: "Alto" },
  { name: "Mediano plazo", days: 15, riskLevel: "Medio" },
  { name: "Largo plazo", days: 30, riskLevel: "Bajo" },
] as const;

// Del más bajo al más alto, con los nombres que manda el API.
export const RISK_LEVEL_ORDER = priorityOptions
  .map((option) => option.riskLevel)
  .reverse();

export const formatDayLabel = (days: number) => {
  const absDays = Math.abs(days);
  return `${days} ${absDays === 1 ? "día" : "días"}`;
};

export const getPriorityLabel = (priorityDays?: number | null) => {
  if (!priorityDays) return "Sin prioridad";
  const option = priorityOptions.find((item) => item.days === priorityDays);
  return option
    ? `${option.name} (${formatDayLabel(option.days)})`
    : formatDayLabel(priorityDays);
};

export const getRemainingDays = (
  createdAt?: Date | string | null,
  priorityDays?: number | null,
) => {
  if (!createdAt || !priorityDays) return "N/A";

  const createdDate = new Date(createdAt);
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + priorityDays);

  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return `${diffDays}`;
};

/** Nivel de riesgo de la prioridad (nombres del API), o null sin prioridad. */
export const getPriorityRiskLevel = (priorityDays?: number | null) =>
  priorityOptions.find((item) => item.days === priorityDays)?.riskLevel ?? null;

export type Deadline =
  | { state: "remaining"; days: number }
  | { state: "overdue"; days: number }
  | {
      state: "resolved";
      days: number;
      isOnTime: boolean | null;
      daysLate: number;
    };

/**
 * Plazo para mostrar en tarjeta y detalle, con la misma regla que la tabla:
 * abierto o en progreso → días restantes o vencido; cerrado → en cuántos días
 * se resolvió. Sin prioridad (o cancelado) no hay plazo.
 */
export const getDeadline = ({
  status,
  createdAt,
  solutionDate,
  priorityDays,
}: {
  status: string;
  createdAt?: Date | string | null;
  solutionDate?: Date | string | null;
  priorityDays?: number | null;
}): Deadline | null => {
  if (status === STATUS_CLOSED) {
    const resolution = getResolutionDays(createdAt, solutionDate, priorityDays);
    return resolution && { state: "resolved", ...resolution };
  }

  if (status !== STATUS_OPEN && status !== STATUS_IN_PROGRESS) return null;

  const remaining = Number(getRemainingDays(createdAt, priorityDays));
  if (Number.isNaN(remaining)) return null;

  return remaining < 0
    ? { state: "overdue", days: Math.abs(remaining) }
    : { state: "remaining", days: remaining };
};

// Days it took to close (partial days count as a full day) and whether it
// was closed within the priority deadline (createdAt + priorityDays).
export const getResolutionDays = (
  createdAt?: Date | string | null,
  solutionDate?: Date | string | null,
  priorityDays?: number | null,
) => {
  if (!createdAt || !solutionDate) return null;

  const diffMs =
    new Date(solutionDate).getTime() - new Date(createdAt).getTime();

  if (Number.isNaN(diffMs)) return null;

  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    days,
    isOnTime: priorityDays ? days <= priorityDays : null,
    daysLate: priorityDays ? Math.max(0, days - priorityDays) : 0,
  };
};
