import { ManufacturingPlant } from "./manufacturing-plants.interfaces";

export interface Employee {
  id: number;
  code: number;
  name: string;
  birthdate: Date | null;
  dateOfAdmission: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  area: Area;
  position: Area;
  gender: Area;
  manufacturingPlants: ManufacturingPlant[];
}

/** Colaborador en selectores (GET /employees?view=options): sin relaciones. */
export type EmployeeOption = Pick<Employee, "id" | "code" | "name">;

interface Area {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogEmployee {
  areas: Area[];
  positions: Area[];
  manufacturingPlants: ManufacturingPlant[];
  genres: Area[];
}

/** Catálogo simple (id + nombre), p. ej. puestos. */
export interface BasicData {
  id: number;
  name: string;
}
