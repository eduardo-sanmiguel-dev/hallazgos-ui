import axiosWrapper, { idempotencyHeaders } from "./axiosWrapper";
import { CatalogICS, ICSData } from "@interfaces";
import { IFiltersIcs } from "@routes/ics/_components/FiltersIcs";
import type { UploadOptions } from "./evidences.service";

const baseURL = "/ics";

const api = axiosWrapper({
  baseURL: baseURL,
});

interface Payload {
  manufacturingPlantId: string;
  totalPeople: number;
  rouleOfLifeId: string;
  standardOfBehaviorId: string;
  areaOfBehaviorId: string;
  employeeIds: number[];
}

const findAll = async ({
  manufacturingPlantId,
  name,
}: Partial<IFiltersIcs>) => {
  const { data } = await api.get<ICSData[]>("", {
    params: {
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(name && { name }),
    },
  });
  return data;
};

const findAllPaginated = async ({
  manufacturingPlantId,
  areaOfBehaviorId,
  name,
  page,
  limit,
}: IFiltersIcs & { page: number; limit: number }) => {
  const { data } = await api.get<{ data: ICSData[]; count: number }>("", {
    params: {
      page,
      limit,
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(areaOfBehaviorId && { areaOfBehaviorId }),
      ...(name && { name }),
    },
  });
  return data;
};

// Pasa por el interceptor (antes axios directo, sin aviso de error): tiempo
// límite, aviso por tipo, "Reintentar" y clave de idempotencia.
const create = async (formData: FormData, options: UploadOptions = {}) => {
  const { data } = await api.post<ICSData>("", formData, {
    headers: idempotencyHeaders(options.idempotencyKey),
    onUploadProgress: options.onUploadProgress,
  });
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<ICSData>(`/${id}`, payload);
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<ICSData>(`/${id}`);
  return data;
};

const catalogs = async () => {
  const { data } = await api.get<CatalogICS[]>(`/catalogs`);
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<ICSData>(`/${id}`);
  return data;
};

export const IcsService = {
  findAll,
  findAllPaginated,
  create,
  update,
  findOne,
  catalogs,
  remove,
};
