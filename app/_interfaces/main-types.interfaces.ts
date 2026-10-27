import { SecondaryType } from "./secondary-types.interfaces";

export interface MainType {
  id: number;
  name: string;
  isActive: boolean;
  // Foto obligatoria al crear y cerrar; si falta en la respuesta se exige.
  requiresEvidence?: boolean;
  createdAt: Date;
  updatedAt: Date;
  secondaryTypes: SecondaryType[];
}
