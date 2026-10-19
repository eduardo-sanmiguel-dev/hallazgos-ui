import { withCatalogInvalidation } from "@shared/libs/catalogKeys";
import axiosWrapper from "./axiosWrapper";
import { Processes, Zone } from "@interfaces";

interface Payload {
  name: string;
  manufacturingPlantId: number;
}

const api = axiosWrapper({
  baseURL: "/processes",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<Zone>("", payload);
  return data;
};

const findAll = async (filters: {
  name?: string;
  manufacturingPlantId?: string;
  manufacturingPlantNames?: string[];
}) => {
  const { data } = await api.get<Zone[]>("", {
    params: {
      ...(filters?.name && {
        name: filters.name,
      }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.manufacturingPlantNames && {
        manufacturingPlantNames: filters.manufacturingPlantNames,
      }),
    },
    paramsSerializer: {
      indexes: null, // => manufacturingPlantNames=Planta%20Norte&manufacturingPlantNames=Planta%20Sur
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<Zone>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<Zone>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<Zone>(`/${id}`);
  return data;
};

// Igual que findAll, pero paginado en la BD (page 1-based).
const findAllPaginated = async (filters: {
  name?: string;
  manufacturingPlantId?: string;
  page: number;
  limit: number;
}) => {
  const { data } = await api.get<{ data: Processes[]; count: number }>("", {
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.name && { name: filters.name }),
      ...(filters.manufacturingPlantId && { manufacturingPlantId: filters.manufacturingPlantId }),
    },
  });
  return data;
};

export const ProcessesService = {
  findAllPaginated,
  create: withCatalogInvalidation(create, "processes"),
  findAll,
  findOne,
  update: withCatalogInvalidation(update, "processes"),
  remove: withCatalogInvalidation(remove, "processes"),
};
