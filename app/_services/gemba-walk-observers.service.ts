import axiosWrapper from "./axiosWrapper";
import { GembaWalkObserver } from "@interfaces";

interface PayloadCreate {
  manufacturingPlantId: number;
  gembaWalkZoneId: number;
  userIds: number[];
}

interface PayloadUpdate {
  manufacturingPlantId: number;
  gembaWalkZoneId: number;
  userId: number;
}

const api = axiosWrapper({
  baseURL: "/gemba-walk/observers",
});

const create = async (payload: PayloadCreate) => {
  const { data } = await api.post<GembaWalkObserver[]>("", payload);
  return data;
};

const findAll = async (filters: {
  manufacturingPlantId?: string;
  gembaWalkZoneId?: string;
  userName?: string;
}) => {
  const { data } = await api.get<GembaWalkObserver[]>("", {
    params: {
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.gembaWalkZoneId && {
        gembaWalkZoneId: filters.gembaWalkZoneId,
      }),
      ...(filters?.userName && {
        userName: filters.userName,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<GembaWalkObserver>(`/${id}`);
  return data;
};

const update = async (id: number, payload: PayloadUpdate) => {
  const { data } = await api.patch<GembaWalkObserver>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<GembaWalkObserver>(`/${id}`);
  return data;
};

export const GembaWalkObserversService = {
  create,
  findAll,
  findOne,
  update,
  remove,
};
