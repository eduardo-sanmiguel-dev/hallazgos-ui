import axiosWrapper, { idempotencyHeaders, submitResult, type SubmitResult } from "./axiosWrapper";
import { CatalogICS, ICSData } from "@interfaces";
import { IFiltersIcs } from "@routes/ics/_components/FiltersIcs";
import type { UploadOptions } from "./evidences.service";
import { sortQueryParams, type SortQuery } from "@shared/utils/tableSort";

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

const findAllPaginated = async ({
  manufacturingPlantId,
  areaOfBehaviorId,
  name,
  page,
  limit,
  orderBy,
  order,
}: IFiltersIcs & { page: number; limit: number } & SortQuery) => {
  const { data } = await api.get<{ data: ICSData[]; count: number }>("", {
    params: {
      page,
      limit,
      ...sortQueryParams({ orderBy, order }),
      ...(manufacturingPlantId && { manufacturingPlantId }),
      ...(areaOfBehaviorId && { areaOfBehaviorId }),
      ...(name && { name }),
    },
  });
  return data;
};

// Pasa por el interceptor (antes axios directo, sin aviso de error): tiempo
// límite, aviso por tipo, "Reintentar" y clave de idempotencia. `replayed`:
// el API ya lo había guardado con esa clave (borrador reenviado).
const create = async (
  formData: FormData,
  options: UploadOptions = {},
): Promise<SubmitResult<ICSData>> =>
  submitResult(
    await api.post<ICSData>("", formData, {
      headers: idempotencyHeaders(options.idempotencyKey),
      onUploadProgress: options.onUploadProgress,
    }),
  );

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<ICSData>(`/${id}`, payload);
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
  findAllPaginated,
  create,
  update,
  catalogs,
  remove,
};
