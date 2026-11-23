import { ManufacturingPlant } from "./manufacturing-plants.interfaces";
import type { EvidencePermissions } from "./userSession.interfaces";
import { Processes } from "./processes.interfaces";
import { Zone } from "./zones.interfaces";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  manufacturingPlants: ManufacturingPlant[];
  zones: Zone[];
  processes: Processes[];
  /**
   * Recibe los avisos que se mandan a toda la planta (hallazgo creado o
   * cancelado). Ausente con un API anterior: se trata como true.
   */
  plantNotifications?: boolean;
  /** Solo en el usuario en sesión (get-information-current-user). */
  evidencePermissions?: EvidencePermissions;
  /**
   * Solo en el usuario en sesión: si puede usar Gemba Walk. Ausente con un
   * API anterior (se pregunta a GET /gemba-walk/walks/access).
   */
  isGembaWalkObserver?: boolean;
}

/** POST /mail-preferences(/lookup): la cuenta del enlace de baja. */
export interface MailPreferences {
  /** Enmascarado por el API ("p•••••@planta.com"). */
  email: string;
  plantNotifications: boolean;
}

/** Usuario en selectores (GET /users?view=options): sin relaciones. */
export type UserOption = Pick<User, "id" | "name" | "email" | "role">;
