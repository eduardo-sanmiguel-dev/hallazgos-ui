import { IFiltersConfigTg } from "@routes/config-tg/page";
import axiosWrapper from "./axiosWrapper";
import { ConfigTg } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/configs-tg",
});

interface Payload {
  manufacturingPlantId: number;
  positionId: number;
  areaManagerId: number;
  humanResourceManagerId: number;
  topics: {
    id: number;
    responsibleIds: number[];
  }[];
}

const create = async (payload: Partial<Payload>) => {
  const { data } = await api.post<ConfigTg>(``, payload);
  return data;
};

const findAll = async ({
  manufacturingPlantId,
  positionId,
}: IFiltersConfigTg) => {
  const { data } = await api.get<ConfigTg[]>(``, {
    params: {
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(positionId && { positionId }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<ConfigTg>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Partial<Payload>) => {
  const { data } = await api.patch<ConfigTg>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<ConfigTg>(`/${id}`);
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
  const { data } = await api.get<{ data: ConfigTg[]; count: number }>("", {
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

export const ConfigTgService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
