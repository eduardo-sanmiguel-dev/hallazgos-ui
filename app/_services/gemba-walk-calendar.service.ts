import axiosWrapper from "./axiosWrapper";
import { GembaWalkCalendar } from "@interfaces";

// scheduledAt / startDate / endDate viajan en ISO 8601 con zona (toISOString).
interface PayloadCreate {
  events: {
    gembaWalkZoneId: number;
    scheduledAt: string;
    isAdditional: boolean;
  }[];
}

interface PayloadUpdate {
  events: {
    id: number;
    gembaWalkZoneId?: number;
    scheduledAt?: string;
    isAdditional?: boolean;
  }[];
}

const api = axiosWrapper({
  baseURL: "/gemba-walk/calendar",
});

const create = async (payload: PayloadCreate) => {
  const { data } = await api.post<GembaWalkCalendar[]>("", payload);
  return data;
};

const findAll = async (filters: {
  manufacturingPlantId?: string;
  gembaWalkZoneId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await api.get<GembaWalkCalendar[]>("", {
    params: {
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.gembaWalkZoneId && {
        gembaWalkZoneId: filters.gembaWalkZoneId,
      }),
      ...(filters?.startDate && {
        startDate: filters.startDate,
      }),
      ...(filters?.endDate && {
        endDate: filters.endDate,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<GembaWalkCalendar>(`/${id}`);
  return data;
};

const update = async (payload: PayloadUpdate) => {
  const { data } = await api.patch<GembaWalkCalendar[]>("", payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<GembaWalkCalendar>(`/${id}`);
  return data;
};

export const GembaWalkCalendarService = {
  create,
  findAll,
  findOne,
  update,
  remove,
};
