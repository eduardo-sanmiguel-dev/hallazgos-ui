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

export interface Epp {
  id: number;
  code: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: Area;
  area: Area;
  epps: EppElement[];
}

interface Area {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EppElement {
  id: number;
  signature: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createBy: User;
  equipments: Equipment[];
}

interface Equipment {
  id: number;
  deliveryDate: string;
  returnDate: null;
  quantity: number;
  observations: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  equipment: Area;
}
