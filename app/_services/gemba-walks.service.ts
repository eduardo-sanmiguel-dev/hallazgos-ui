import axiosWrapper from "./axiosWrapper";
import { GembaWalk, GembaWalkCalendar } from "@interfaces";

interface PayloadCreate {
  gembaWalkCalendarId: number;
  startToken: string;
  results: {
    gembaWalkEvaluationId: number;
    isCompliant: boolean;
    comments?: string;
  }[];
}

// Evento del calendario informativo, desde la perspectiva del observador:
// DONE = lo realizó él (gembaWalkId para ver el detalle), MISSED = no lo
// realizó (otro observador lo hizo o venció la tolerancia), PENDING = aún se
// puede iniciar.
export interface GembaWalkScheduleEvent {
  id: number;
  scheduledAt: string;
  isAdditional: boolean;
  gembaWalkZone: {
    id: number;
    nameZone: string;
    nameLocation: string;
  };
  status: "DONE" | "MISSED" | "PENDING";
  gembaWalkId: number | null;
}

const api = axiosWrapper({
  baseURL: "/gemba-walk/walks",
});

// Indica si el usuario de la sesión es observador (acceso al módulo).
const access = async () => {
  const { data } = await api.get<{ isObserver: boolean }>("/access");
  return data;
};

// Eventos de hoy de la planta sin recorrido registrado.
const findAvailableEvents = async (manufacturingPlantId: string) => {
  const { data } = await api.get<GembaWalkCalendar[]>("/available-events", {
    params: { manufacturingPlantId },
  });
  return data;
};

// Inicia el recorrido (valida la tolerancia) y devuelve el comprobante con la
// hora de inicio que se envía al registrarlo.
const start = async (gembaWalkCalendarId: number) => {
  const { data } = await api.post<{ startToken: string; startedAt: string }>(
    "/start",
    { gembaWalkCalendarId },
  );
  return data;
};

// Solo lectura. startDate / endDate en ISO 8601 con zona.
const findCalendar = async (filters: {
  manufacturingPlantId: string;
  startDate: string;
  endDate: string;
}) => {
  const { data } = await api.get<GembaWalkScheduleEvent[]>("/calendar", {
    params: filters,
  });
  return data;
};

const create = async (payload: PayloadCreate) => {
  const { data } = await api.post<GembaWalk>("", payload);
  return data;
};

// startDate / endDate en ISO 8601 con zona (toISOString).
const findAll = async (filters: {
  manufacturingPlantId?: string;
  gembaWalkZoneId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await api.get<GembaWalk[]>("", {
    params: {
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.gembaWalkZoneId && {
        gembaWalkZoneId: filters.gembaWalkZoneId,
      }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<GembaWalk>(`/${id}`);
  return data;
};

export const GembaWalksService = {
  access,
  findAvailableEvents,
  findCalendar,
  start,
  create,
  findAll,
  findOne,
};
