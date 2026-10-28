import dayjs from "@shared/libs/dayjs";

import type { GembaWalkCalendar, GembaWalkEvaluation } from "@interfaces";

export interface Answer {
  isCompliant: boolean;
  comments: string;
}

export interface StartedWalk {
  startToken: string;
  startedAt: string;
}

/** Lo que guarda el borrador local de un recorrido (solo si ya se inició). */
export interface WalkDraftFields {
  manufacturingPlantId: string;
  gembaWalkCalendarId: string;
  started: StartedWalk | null;
  answers: Record<number, Answer>;
  // Para mostrar el recorrido aunque ya no esté entre los disponibles.
  event: { scheduledAt: string; label: string } | null;
}

// Igual que el API: el comprobante de inicio vale 24 horas.
const START_TOKEN_HOURS = 24;

/** "10:30 · Zona - Ubicación (Adicional)", sin el estado de la tolerancia. */
export const eventSummary = (event: GembaWalkCalendar) =>
  `${dayjs(event.scheduledAt).format("HH:mm")} · ${event.gembaWalkZone.nameZone} - ${event.gembaWalkZone.nameLocation}${event.isAdditional ? " (Adicional)" : ""}`;

/**
 * Respuestas de los conceptos de la planta: todo "Cumple" por defecto y, si
 * se recupera un borrador, lo que ya se había marcado (de los conceptos que
 * siguen existiendo).
 */
export const initialAnswers = (
  evaluations: GembaWalkEvaluation[],
  saved: Record<number, Answer> = {},
) =>
  Object.fromEntries(
    evaluations.map(({ id }) => [
      id,
      saved[id] ?? { isCompliant: true, comments: "" },
    ]),
  ) as Record<number, Answer>;

/**
 * Por qué un recorrido iniciado (recuperado del borrador) ya no se puede
 * registrar; null si sí se puede. La tolerancia de 15 minutos no aplica aquí:
 * se validó al iniciar y el API la vuelve a revisar con la hora de inicio del
 * comprobante. `availableIds` son los eventos de hoy sin recorrido (null si
 * no se pudieron consultar: decide el API al registrar).
 */
export const blockedReason = (
  fields: Pick<WalkDraftFields, "started" | "gembaWalkCalendarId" | "event">,
  availableIds: number[] | null,
  now: Date,
) => {
  const { started, event } = fields;
  if (!started) return null;

  if (event && !dayjs(event.scheduledAt).isSame(now, "day")) {
    return `Era un recorrido del ${dayjs(event.scheduledAt).format("DD/MM/YYYY")}: solo se pueden registrar los recorridos del día.`;
  }

  if (
    dayjs(now).diff(dayjs(started.startedAt), "hour", true) >= START_TOKEN_HOURS
  ) {
    return `El inicio del recorrido venció: vale ${START_TOKEN_HOURS} horas.`;
  }

  if (
    availableIds &&
    !availableIds.includes(Number(fields.gembaWalkCalendarId))
  ) {
    return "Este recorrido ya se registró (desde otro dispositivo o por otro observador).";
  }

  return null;
};
