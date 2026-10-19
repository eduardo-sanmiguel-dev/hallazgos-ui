import axiosWrapper from "./axiosWrapper";
import { ManufacturingPlant } from "@interfaces";

interface Payload {
  name: string;
  link: string;
  lat: number;
  lng: number;
}

const api = axiosWrapper({
  baseURL: "/manufacturing-plants",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<ManufacturingPlant>("", payload);
  return data;
};

const findAll = async (filters: { name?: string }) => {
  const { data } = await api.get<ManufacturingPlant[]>("", {
    params: {
      ...(filters?.name && {
        name: filters.name,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<ManufacturingPlant>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<ManufacturingPlant>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<ManufacturingPlant>(`/${id}`);
  return data;
};

// Igual que findAll, pero paginado en la BD (page 1-based).
const findAllPaginated = async (filters: {
  name?: string;
  page: number;
  limit: number;
}) => {
  const { data } = await api.get<{ data: ManufacturingPlant[]; count: number }>("", {
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.name && { name: filters.name }),
    },
  });
  return data;
};

export const ManufacturingPlantsService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
