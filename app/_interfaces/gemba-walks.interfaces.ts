import { GembaWalkCalendar } from "./gemba-walk-calendar.interfaces";

export interface GembaWalkResult {
  id: number;
  // Copia del concepto al momento del recorrido.
  area: string;
  category: string;
  description: string;
  isCompliant: boolean;
  comments?: string | null;
}

export interface GembaWalk {
  id: number;
  // Inicio y fin los fija el servidor; duración en segundos.
  startedAt?: string | null;
  performedAt: string;
  durationSeconds?: number | null;
  isActive: boolean;
  gembaWalkCalendar: Omit<GembaWalkCalendar, "createdBy" | "updatedBy">;
  results: GembaWalkResult[];
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
