import { ManufacturingPlant } from "./manufacturing-plants.interfaces";
import { Area } from "./areas.interfaces";

export interface Zone {
  id: number;
  name: string;
  isActive: boolean;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  manufacturingPlant: ManufacturingPlant;
  area?: Area | null;
}

/**
 * Zona en selectores y filtros (GET /zones?view=options): sin quién la creó
 * ni la planta y el área completas.
 */
export type ZoneOption = Pick<Zone, "id" | "name"> & {
  manufacturingPlant: Pick<ManufacturingPlant, "id" | "name">;
  area: Pick<Area, "id" | "name"> | null;
};
