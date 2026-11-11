import { ManufacturingPlant } from "./manufacturing-plants.interfaces";
import { Zone } from "./zones.interfaces";

/**
 * Permisos especiales del usuario sobre hallazgos, calculados por el API
 * (GET /users/get-information-current-user). El API ya no envía las listas
 * de correos; valida cada acción por su cuenta.
 */
export interface EvidencePermissions {
  /** Actúa como supervisor en cualquier hallazgo (iniciar, cerrar, reasignar). */
  supervisorOverride: boolean;
  /** Puede cancelar hallazgos. */
  cancelEvidence: boolean;
}

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  manufacturingPlants: ManufacturingPlant[];
  zones: Zone[];
  manufacturingPlantsCurrent: number[];
  evidencePermissions: EvidencePermissions;
}
