import { useShallow } from "zustand/shallow";

import { useUserSessionStore } from "@store";
import { evidenceActionsFor } from "../_constants/evidenceActions";

export type { EvidenceActions } from "../_constants/evidenceActions";

// Acciones de cada hallazgo para el usuario en sesión. Los permisos
// especiales llegan en la sesión: ya no se pide GET /permissions/config.
export function useEvidenceActions() {
  const user = useUserSessionStore(
    useShallow((state) => ({
      userId: state.id,
      role: state.role,
      evidencePermissions: state.evidencePermissions,
    })),
  );

  return evidenceActionsFor(user);
}
