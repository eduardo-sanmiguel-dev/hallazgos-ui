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

export const GembaWalkEvaluationsService = {
  create,
  findAll,
  findOne,
  update,
  remove,
};
