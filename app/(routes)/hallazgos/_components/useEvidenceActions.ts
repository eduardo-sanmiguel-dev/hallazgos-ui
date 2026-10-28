import { useEffect, useState } from "react";

import { useShallow } from "zustand/shallow";

import {
  ROLE_ADMINISTRADOR,
  ROLE_SUPERVISOR,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";
import { useUserSessionStore } from "@store";
import { EvidencesService } from "@services";
import { EvidenceGraphql } from "@hooks";

// Qué acciones ve el usuario en cada hallazgo. Es la misma regla que tenía el
// menú de la tabla, en un solo lugar para la tabla y las tarjetas de celular.
// El API valida cada acción por su cuenta.
export function useEvidenceActions() {
  const [supervisorOverrideEmails, setSupervisorOverrideEmails] = useState<
    string[]
  >([]);
  const [cancelEvidenceEmails, setCancelEvidenceEmails] = useState<string[]>(
    [],
  );
  const { userId, role, email } = useUserSessionStore(
    useShallow((state) => ({
      userId: state.id,
      role: state.role,
      email: state.email,
    })),
  );

  useEffect(() => {
    EvidencesService.getPermissionsConfig()
      .then((config) => {
        setSupervisorOverrideEmails(config.supervisorOverrideEmails || []);
        setCancelEvidenceEmails(config.cancelEvidenceEmails || []);
      })
      .catch(() => {
        setSupervisorOverrideEmails([]);
        setCancelEvidenceEmails([]);
      });
  }, []);

  // Cerrado y Cancelado son finales: el API responde 409 a cerrar, cancelar o
  // reasignar fuera de Abierto / En progreso.
  const isActive = (row: EvidenceGraphql) =>
    row.status === STATUS_OPEN || row.status === STATUS_IN_PROGRESS;

  // !Atention: Force close evidence if the user is a supervisor
  const validateSupervisor = (row: EvidenceGraphql) => {
    if (supervisorOverrideEmails.includes(email)) {
      return true;
    }
    return (
      isActive(row) &&
      role === ROLE_SUPERVISOR &&
      (row.supervisors
        .map((supervisor) => Number(supervisor.id))
        .includes(userId) ||
        row.responsibles
          .map((responsible) => Number(responsible.id))
          .includes(userId))
    );
  };

  const canStart = (row: EvidenceGraphql) =>
    (role === ROLE_ADMINISTRADOR || validateSupervisor(row)) &&
    row.status === STATUS_OPEN &&
    !row.imgProcess;

  const canClose = (row: EvidenceGraphql) =>
    validateSupervisor(row) && isActive(row);

  const canReassign = (row: EvidenceGraphql) => {
    if (!isActive(row)) return false;
    if (role === ROLE_ADMINISTRADOR) return true;
    if (supervisorOverrideEmails.includes(email)) return true;

    return (
      row.supervisors.some(
        (supervisor) => Number(supervisor.id) === Number(userId),
      ) ||
      row.responsibles.some(
        (responsible) => Number(responsible.id) === Number(userId),
      )
    );
  };

  const canCancel = (row: EvidenceGraphql) =>
    isActive(row) &&
    (role === ROLE_ADMINISTRADOR || cancelEvidenceEmails.includes(email));

  return { isActive, canStart, canClose, canReassign, canCancel };
}

export type EvidenceActions = ReturnType<typeof useEvidenceActions>;
