import { withCatalogInvalidation } from "@shared/libs/catalogKeys";
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
  const { data } = await api.get<{ data: GembaWalkZone[]; count: number }>("", {
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

export const GembaWalkZonesService = {
  findAllPaginated,
  create: withCatalogInvalidation(create, "gembaWalkZones"),
  findAll,
  findOne,
  update: withCatalogInvalidation(update, "gembaWalkZones"),
  remove: withCatalogInvalidation(remove, "gembaWalkZones"),
};
