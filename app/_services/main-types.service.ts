import axiosWrapper from "./axiosWrapper";
import { MainType } from "@interfaces";

interface Payload {
  name: string;
}

const api = axiosWrapper({
  baseURL: "/main-types",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<MainType>("", payload);
  return data;
};

const findAll = async (filters: { name?: string }) => {
  const { data } = await api.get<MainType[]>("", {
    params: {
      ...(filters?.name && {
        name: filters.name,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<MainType>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<MainType>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<MainType>(`/${id}`);
  return data;
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
  const { data } = await api.get<{ data: MainType[]; count: number }>("", {
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

export const MainTypesService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
