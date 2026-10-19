import axiosWrapper from "./axiosWrapper";
import { GembaWalkEvaluation } from "@interfaces";

interface Payload {
  manufacturingPlantId: number;
  area: string;
  category: string;
  description: string;
}

const api = axiosWrapper({
  baseURL: "/gemba-walk/evaluations",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<GembaWalkEvaluation>("", payload);
  return data;
};

const findAll = async (filters: {
  manufacturingPlantId?: string;
  category?: string;
  search?: string;
}) => {
  const { data } = await api.get<GembaWalkEvaluation[]>("", {
    params: {
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.category && {
        category: filters.category,
      }),
      ...(filters?.search && {
        search: filters.search,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<GembaWalkEvaluation>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<GembaWalkEvaluation>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<GembaWalkEvaluation>(`/${id}`);
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
  const { data } = await api.get<{
    data: GembaWalkEvaluation[];
    count: number;
  }>("", {
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

export const GembaWalkEvaluationsService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
