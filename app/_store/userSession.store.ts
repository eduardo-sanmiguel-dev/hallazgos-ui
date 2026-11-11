import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { EvidencePermissions, UserSession } from "@interfaces";

/** Sin permisos especiales (también si el API aún no los envía). */
export const NO_EVIDENCE_PERMISSIONS: EvidencePermissions = {
  supervisorOverride: false,
  cancelEvidence: false,
};

const stateInitial = {
  id: 0,
  name: "",
  email: "",
  role: "",
  isActive: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  manufacturingPlants: [],
  zones: [],
  manufacturingPlantsCurrent: [],
  evidencePermissions: NO_EVIDENCE_PERMISSIONS,
};

type Actions = {
  setSession: (userSession: UserSession) => void;
  resetSession: () => void;
};

export const useUserSessionStore = create<UserSession & Actions>()(
  persist<UserSession & Actions>(
    (set) => ({
      ...stateInitial,
      setSession: (userSession: UserSession) => set(userSession),
      resetSession: () => set(stateInitial),
    }),
    {
      name: "user-session",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
