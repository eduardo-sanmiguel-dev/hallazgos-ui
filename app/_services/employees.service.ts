import { IFiltersEmployees } from "@routes/employees/_components/FiltersEmployees";
import { BasicData, CatalogEmployee, Employee } from "@interfaces";
import axiosWrapper from "./axiosWrapper";

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
  assignedUserId,
  isActive,
}: IFiltersEmployees) => {
  const { data } = await api.get<Employee[]>("", {
    params: {
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
      ...(positionId && { positionId }),
      ...(areaId && { areaId }),
      ...(assignedUserId && { assignedUserId }),
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
  // complete | pending | no-guide (guía del puesto actual)
  signatureStatus?: string;
  page: number;
  limit: number;
}) => {
  const {
    manufacturingPlantId,
    name,
    assignedUserId,
    areaId,
    positionId,
    genreId,
    isActive,
    signatureStatus,
  } = filters;
  const { data } = await api.get<{ data: Employee[]; count: number }>("", {
    params: {
      page,
      limit,
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
      ...(assignedUserId && { assignedUserId }),
      ...(areaId && { areaId }),
      ...(positionId && { positionId }),
      ...(genreId && { genreId }),
      ...(isActive && { isActive }),
      ...(signatureStatus && { signatureStatus }),
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
  create,
  update,
  findOne,
  catalogs,
  remove,
  findPositions,
};
