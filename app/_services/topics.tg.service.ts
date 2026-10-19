import { IFiltersTopics } from "@routes/topics-tg/page";
import axiosWrapper from "./axiosWrapper";
import { Topic } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/topics",
});

const create = async (payload: Partial<Topic>) => {
  const { data } = await api.post<Topic>(``, payload);
  return data;
};

const findAll = async ({ manufacturingPlantId, name }: IFiltersTopics) => {
  const { data } = await api.get<Topic[]>(``, {
    params: {
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<Topic>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Partial<Topic>) => {
  const { data } = await api.patch<Topic>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<Topic>(`/${id}`);
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
  const { data } = await api.get<{ data: Topic[]; count: number }>("", {
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

export const TopicsService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
