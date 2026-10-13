import axiosWrapper from "./axiosWrapper";
import { GembaWalkZone } from "@interfaces";

interface Payload {
  manufacturingPlantId: number;
  nameZone: string;
  nameLocation: string;
}

const api = axiosWrapper({
  baseURL: "/gemba-walk/zones",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<GembaWalkZone>("", payload);
  return data;
};

const findAll = async (filters: {
  nameZone?: string;
  nameLocation?: string;
  manufacturingPlantId?: string;
}) => {
  const { data } = await api.get<GembaWalkZone[]>("", {
    params: {
      ...(filters?.nameZone && {
        nameZone: filters.nameZone,
      }),
      ...(filters?.nameLocation && {
        nameLocation: filters.nameLocation,
      }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<GembaWalkZone>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<GembaWalkZone>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<GembaWalkZone>(`/${id}`);
  return data;
};

export const GembaWalkZonesService = {
  create,
  findAll,
  findOne,
  update,
  remove,
};
