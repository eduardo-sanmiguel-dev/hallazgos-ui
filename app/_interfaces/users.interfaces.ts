import { ManufacturingPlant } from "./manufacturing-plants.interfaces";
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
}

/** Usuario en selectores (GET /users?view=options): sin relaciones. */
export type UserOption = Pick<User, "id" | "name" | "email" | "role">;
