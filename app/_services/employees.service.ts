import { IFiltersEmployees } from "@routes/employees/_components/FiltersEmployees";
import { BasicData, CatalogEmployee, Employee } from "@interfaces";
import axiosWrapper from "./axiosWrapper";
import { withCatalogInvalidation } from "@shared/libs/catalogKeys";

const api = axiosWrapper({
  baseURL: "/employees",
});

interface Payload {
  code: string;
  name: string;
}

const findAll = async ({
  manufacturingPlantId,
  positionId,
  areaId,
  name,
  isActive,
}: IFiltersEmployees) => {
  const { data } = await api.get<Employee[]>("", {
    params: {
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
      ...(positionId && { positionId }),
      ...(areaId && { areaId }),
      ...(isActive !== undefined && isActive !== "" && { isActive }),
    },
  });
  return data;
};

const findAllPaginated = async ({
  page,
  limit,
  ...filters
}: Omit<IFiltersEmployees, "areaId" | "positionId"> & {
  areaId?: string;
  positionId?: string;
  genreId?: string;
  page: number;
  limit: number;
}) => {
  const { manufacturingPlantId, name, areaId, positionId, genreId, isActive } =
    filters;
  const { data } = await api.get<{ data: Employee[]; count: number }>("", {
    params: {
      page,
      limit,
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
      ...(areaId && { areaId }),
      ...(positionId && { positionId }),
      ...(genreId && { genreId }),
      ...(isActive && { isActive }),
    },
  });
  return data;
};

const create = async (payload: Payload) => {
  const { data } = await api.post<Employee>("", payload);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<Employee>(`/${id}`, payload);
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<Employee>(`/${id}`);
  return data;
};

const catalogs = async () => {
  const { data } = await api.get<CatalogEmployee>(`/catalogs`);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<Employee>(`/${id}`);
  return data;
};

const findPositions = async () => {
  const { data } = await api.get<BasicData[]>(`/positions`);
  return data;
};

export const EmployeesService = {
  findAll,
  findAllPaginated,
  create: withCatalogInvalidation(create, "employees"),
  update: withCatalogInvalidation(update, "employees"),
  findOne,
  catalogs,
  remove: withCatalogInvalidation(remove, "employees"),
  findPositions,
};
