import {
  ROLE_ADMINISTRADOR,
  ROLE_SUPERVISOR,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";
import type { EvidencePermissions, EvidenceRow } from "@interfaces";

export interface EvidenceActionsUser {
  userId: number;
  role: string;
  /** Calculados por el API; sin ellos, ningún permiso especial. */
  evidencePermissions?: EvidencePermissions;
}

/**
 * Qué acciones ve el usuario en cada hallazgo (tabla y tarjetas de celular).
 * Es la misma regla que valida el API, que además revisa cada acción. Antes
 * los permisos especiales salían de comparar el correo con listas que el API
 * enviaba completas; ahora llegan calculados en la sesión.
 */
export function evidenceActionsFor({ userId, role, evidencePermissions }: EvidenceActionsUser) {
  const supervisorOverride = evidencePermissions?.supervisorOverride ?? false;
  const cancelEvidence = evidencePermissions?.cancelEvidence ?? false;
  const isAdmin = role === ROLE_ADMINISTRADOR;

  // Cerrado y Cancelado son finales: el API responde 409 a cerrar, cancelar o
  // reasignar fuera de Abierto / En progreso.
  const isActive = (row: EvidenceRow) =>
    row.status === STATUS_OPEN || row.status === STATUS_IN_PROGRESS;

  const isAssigned = (row: EvidenceRow) =>
    row.supervisors.some((supervisor) => Number(supervisor.id) === Number(userId)) ||
    row.responsibles.some((responsible) => Number(responsible.id) === Number(userId));

  // Supervisor especial: actúa como supervisor en cualquier hallazgo.
  const validateSupervisor = (row: EvidenceRow) =>
    supervisorOverride || (isActive(row) && role === ROLE_SUPERVISOR && isAssigned(row));

  const canStart = (row: EvidenceRow) =>
    (isAdmin || validateSupervisor(row)) && row.status === STATUS_OPEN && !row.imgProcess;

  const canClose = (row: EvidenceRow) => validateSupervisor(row) && isActive(row);

  const canReassign = (row: EvidenceRow) =>
    isActive(row) && (isAdmin || supervisorOverride || isAssigned(row));

  const canCancel = (row: EvidenceRow) => isActive(row) && (isAdmin || cancelEvidence);

  return { isActive, canStart, canClose, canReassign, canCancel };
}

export type EvidenceActions = ReturnType<typeof evidenceActionsFor>;
