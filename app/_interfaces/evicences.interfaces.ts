import { ManufacturingPlant } from "./manufacturing-plants.interfaces";

export interface Evidence {
  id: number;
  imgEvidence: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  manufacturingPlant: ManufacturingPlant;
  mainType: GenericType;
  secondaryType: GenericType;
  zone: GenericType;
  process?: GenericType;
  user: User;
  supervisors: User[];
  responsibles: User[];
  status: string;
  priorityDays?: number | null;
  imgSolution: string;
  imgProcess: string;
  solutionDate: Date;
  startProcessDate: Date;
  comments: Comment[];
  description: string;
}

export interface Comment {
  id: number;
  comment: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

interface GenericType {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Comentario de un hallazgo en la lista (GET /evidences). */
export interface EvidenceRowComment {
  id: number;
  comment: string;
  user: { name: string };
  createdAt: Date;
}

interface OnlyName {
  name: string;
}

/**
 * Hallazgo de la lista (GET /evidences, paginada): lo que usan la tabla, las
 * tarjetas y el detalle.
 */
export interface EvidenceRow {
  id: number;
  status: string;
  priorityDays?: number | null;
  createdAt: Date;
  updatedAt: Date;
  solutionDate: Date | null;
  startProcessDate: Date | null;
  /** Quién lo pasó a "En progreso" (null: anterior a que se registrara). */
  startedBy?: OnlyName | null;
  /** Quién lo cerró (null: anterior a que se registrara). */
  closedBy?: OnlyName | null;
  /** Quién hizo la última reasignación y cuándo (null: nunca, o antes de
   * que se registrara). */
  reassignedBy?: OnlyName | null;
  reassignedAt?: Date | null;
  imgEvidence: string;
  imgProcess: string;
  imgSolution: string;
  manufacturingPlant: { id: number; name: string };
  user: OnlyName;
  mainType: OnlyName & { requiresEvidence?: boolean | null };
  secondaryType: OnlyName;
  supervisors: { id: number; name: string }[];
  responsibles: { id: number; name: string }[];
  comments: EvidenceRowComment[];
  zone: {
    name: string;
    area?: OnlyName | null;
  };
  process: OnlyName | null;
  description?: string;
  descriptionSolution?: string;
}
