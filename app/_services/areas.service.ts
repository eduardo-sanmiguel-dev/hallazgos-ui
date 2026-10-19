import axiosWrapper from "./axiosWrapper";
import { Area } from "@interfaces";

interface Payload {
  name: string;
  manufacturingPlantId: number;
  coordinateX?: number;
  coordinateY?: number;
  zoomLevel?: number;
}

const api = axiosWrapper({
  baseURL: "/areas",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<Area>("", payload);
  return data;
};

const findAll = async (filters: {
  name?: string;
  manufacturingPlantId?: string;
}) => {
  const { data } = await api.get<Area[]>("", {
    params: {
      ...(filters?.name && {
        name: filters.name,
      }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<Area>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<Area>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<Area>(`/${id}`);
  return data;
};

// Igual que findAll, pero paginado en la BD (page 1-based).
const findAllPaginated = async (filters: {
  name?: string;
  manufacturingPlantId?: string;
  page: number;
  limit: number;
}) => {
  const { data } = await api.get<{ data: Area[]; count: number }>("", {
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.name && { name: filters.name }),
      ...(filters.manufacturingPlantId && { manufacturingPlantId: filters.manufacturingPlantId }),
    },
  });
  return data;
};

export const AreasService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
