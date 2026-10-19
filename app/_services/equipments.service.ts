import axiosWrapper from "./axiosWrapper";
import { Equipment } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/equipments",
});

const findAll = async ({
  manufacturingPlantId,
  name = "",
}: {
  manufacturingPlantId: string;
  name?: string;
}) => {
  const { data } = await api.get<Equipment[]>("", {
    params: {
      manufacturingPlantId,
      name,
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<Equipment>(`/${id}`);
  return data;
};

const create = async (payload: {
  name: string;
  deliveryFrequency?: number | null;
  manufacturingPlantId: number;
}) => {
  const { data } = await api.post<Equipment>("", payload);
  return data;
};

const update = async (
  id: number,
  payload: {
    name: string;
    deliveryFrequency?: number | null;
    manufacturingPlantId: number;
  },
) => {
  const { data } = await api.patch<Equipment>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  await api.delete<Equipment>(`/${id}`);
};

// Igual que findAll, pero paginado en la BD (page 1-based).
// Los filtros vacíos no se envían.
const findAllPaginated = async ({
  page,
  limit,
  ...filters
}: {
  page: number;
  limit: number;
  [key: string]: string | number | undefined;
}) => {
  const { data } = await api.get<{ data: Equipment[]; count: number }>("", {
    params: {
      page,
      limit,
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== "" && value !== undefined,
        ),
      ),
    },
  });
  return data;
};

export const EquipmentsService = {
  findAllPaginated,
  findOne,
  findAll,
  create,
  update,
  remove,
};
