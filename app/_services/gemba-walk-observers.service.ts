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
  const { data } = await api.get<{ data: GembaWalkObserver[]; count: number }>(
    "",
    {
      params: {
        page,
        limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== "" && value !== undefined,
          ),
        ),
      },
    },
  );
  return data;
};

export const GembaWalkObserversService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
