import axiosWrapper from "./axiosWrapper";
import { EmergencyTeam, ExtinguisherType } from "@interfaces";

interface Payload {
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: number;
  manufacturingPlantId: number;
}

const api = axiosWrapper({
  baseURL: "/emergency-teams",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<EmergencyTeam>("", payload);
  return data;
};

const findAll = async (filters: {
  search?: string;
  manufacturingPlantId?: string;
}) => {
  const { data } = await api.get<EmergencyTeam[]>("", {
    params: {
      ...(filters?.search && {
        search: filters.search,
      }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
    },
  });
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<EmergencyTeam>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<EmergencyTeam>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<EmergencyTeam>(`/${id}`);
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
  const { data } = await api.get<{ data: EmergencyTeam[]; count: number }>("", {
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

export const EmergencyTeamsService = {
  findAllPaginated,
  create,
  findAll,
  findOne,
  update,
  remove,
};
