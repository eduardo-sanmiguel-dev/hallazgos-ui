import { User } from "./users.interfaces";

export type EppSortableColumn = "name" | "code" | "position" | "area";

export interface QueryEpps {
  manufacturingPlantId: string;
  /** Página 1-based, como la espera la API. */
  page: number;
  limit: number;
  search?: string;
  orderBy?: EppSortableColumn;
  order?: "asc" | "desc";
  areaId?: string;
  positionId?: string;
  equipmentId?: string;
  /** Rango de fecha de entrega, YYYY-MM-DD. */
  startDate?: string;
  endDate?: string;
}

export interface EppsPage {
  data: Epp[];
  count: number;
  page: number;
  limit: number;
}

export interface PayloadCreateEpp {
  employeeId: number;
  signature: string;
  equipments: {
    id: number;
    quantity: number;
    observations: string;
  }[];
}

/** Colaborador en la tabla de EPP (su historial se pide al expandir la fila). */
export interface Epp {
  id: number;
  code: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: Area;
  area: Area;
}

interface Area {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Equipo entregado (GET /epps/employees/:id/history), uno por fila. */
export interface EppHistoryItem {
  id: number;
  deliveryDate: string;
  observations: string;
  equipment: Pick<Area, "id" | "name">;
  /** Firma de la entrega (data URL). */
  signature: string;
  createBy: Pick<User, "id" | "name"> | null;
}
