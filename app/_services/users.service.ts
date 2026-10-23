import { withCatalogInvalidation } from "@shared/libs/catalogKeys";
import axiosWrapper from "./axiosWrapper";
import { User, UserOption } from "@interfaces";

interface Payload {
  name: string;
  email: string;
  password: string;
  rule: string;
  manufacturingPlantNames: string[];
  zoneNames: string[];
}

const api = axiosWrapper({
  baseURL: "/users",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<User>("", payload);
  return data;
};

/**
 * Usuarios para selectores: solo id, nombre, correo y rol (`view=options`).
 * Con plantas, zonas y procesos la respuesta llegaba a pesar megabytes.
 */
const findAll = async (filters: {
  name?: string;
  manufacturingPlantId?: string;
  rule?: string;
  // Solo supervisores de esa zona.
  zoneId?: string;
  // Cualquier usuario con alguna de esas zonas.
  zoneIds?: string[];
  orderBy?: string;
}) => {
  const { data } = await api.get<UserOption[]>("", {
    params: {
      view: "options",
      ...(filters?.zoneIds?.length && {
        zoneIds: filters.zoneIds.join(","),
      }),
      ...(filters?.name && {
        name: filters.name,
      }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters?.rule && {
        rule: filters.rule,
      }),
      ...(filters?.zoneId && {
        zoneId: filters.zoneId,
      }),
      ...(filters?.orderBy && {
        orderBy: filters.orderBy,
      }),
    },
  });
  return data;
};

const findAllPaginated = async (filters: {
  // Nombre o correo electrónico.
  search?: string;
  manufacturingPlantId?: string;
  rule?: string;
  zoneId?: string;
  processId?: string;
  page: number;
  limit: number;
}) => {
  const { data } = await api.get<{ data: User[]; count: number }>("", {
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.search?.trim() && { search: filters.search.trim() }),
      ...(filters.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters.rule && { rule: filters.rule }),
      ...(filters.zoneId && { zoneId: filters.zoneId }),
      ...(filters.processId && { processId: filters.processId }),
    },
  });
  return data;
};

const getInformationCurrentUser = async () => {
  const { data } = await api.get<User>("/get-information-current-user");
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<User>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<User>(`/${id}`, payload);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<User>(`/${id}`);
  return data;
};

/**
 * Supervisores de una zona de la planta (solo id, nombre y correo). Antes se
 * descargaban todos con sus zonas y procesos (~1.5 MB) para filtrar aquí.
 */
const findZoneSupervisors = async (filters: {
  manufacturingPlantId: string;
  zoneId: string;
}) => {
  const { data } = await api.get<Pick<User, "id" | "name" | "email">[]>(
    "/supervisors",
    { params: filters },
  );
  return data;
};

export const UsersService = {
  create: withCatalogInvalidation(create, "users"),
  findAll,
  findAllPaginated,
  getInformationCurrentUser,
  findOne,
  update: withCatalogInvalidation(update, "users"),
  remove: withCatalogInvalidation(remove, "users"),
  findZoneSupervisors,
};
