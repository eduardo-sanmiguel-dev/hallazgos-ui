import axiosWrapper from "./axiosWrapper";
import { SecondaryType } from "@interfaces";

interface Payload {
  name: string;
  mainTypeId: number;
  typeResponsible: string;
}

const api = axiosWrapper({
  baseURL: "/secondary-types",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<SecondaryType>("", payload);
  return data;
};

const findAll = async (filters: { name?: string; mainTypeId?: string }) => {
  const { data } = await api.get<SecondaryType[]>("", {
    params: {
      ...(filters?.name && {
        name: filters.name,
      }),
      ...(filters?.mainTypeId && {
        mainTypeId: filters.mainTypeId,
      }),
    },
  });
  return data;
};

const findAllByManufacturingPlant = async (id: number) => {
  const { data } = await api.get<SecondaryType[]>(
    `/by/manufacturing-plant/${id}`
  );
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<SecondaryType>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<SecondaryType>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<SecondaryType>(`/${id}`);
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
  const { data } = await api.get<{ data: SecondaryType[]; count: number }>("", {
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

export const SecondaryTypesService = {
  findAllPaginated,
  create,
  findAll,
  findAllByManufacturingPlant,
  findOne,
  update,
  remove,
};
