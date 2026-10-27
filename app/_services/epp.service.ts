import {
  EppHistoryItem,
  EppsPage,
  PayloadCreateEpp,
  QueryEpps,
} from "@interfaces";
import axiosWrapper, { idempotencyHeaders } from "./axiosWrapper";
import {
  buildLocalFileNameTimestamp,
  getBrowserTimeZone,
  resolveDownloadFileName,
} from "@shared/utils/downloadFileName";

const api = axiosWrapper({
  baseURL: "/epps",
});

// Con clave de idempotencia: un reintento no duplica la entrega.
const create = async (
  payload: PayloadCreateEpp,
  options: { idempotencyKey?: string } = {},
) => {
  const { data } = await api.post("", payload, {
    headers: idempotencyHeaders(options.idempotencyKey),
  });
  return data;
};

const findPaginated = async ({ search, ...query }: QueryEpps) => {
  const { data } = await api.get<EppsPage>("", {
    params: {
      // Los filtros vacíos no se envían (la API los valida como positivos).
      ...Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== ""),
      ),
      ...(search?.trim() && { search: search.trim() }),
      // El historial (con firmas) se pide por colaborador al expandir la fila.
      withHistory: "false",
    },
  });
  return data;
};

const findEmployeeHistory = async (
  employeeId: number,
  manufacturingPlantId: string,
) => {
  const { data } = await api.get<EppHistoryItem[]>(
    `/employees/${employeeId}/history`,
    { params: { manufacturingPlantId } },
  );
  return data;
};

const downloadFile = async (employeeId: number, employeeCode?: number) => {
  const { data, headers } = await api.get(`/download/file/${employeeId}`, {
    responseType: "blob",
    params: { timeZone: getBrowserTimeZone() },
  });

  // Respaldo: EPP_{NumEmpleado}_AAAA-MM-DD_HHmm_UTC±HH.xlsx con los datos de la fila.
  const fileName = resolveDownloadFileName(
    headers["content-disposition"],
    () =>
      `${["EPP", employeeCode, buildLocalFileNameTimestamp()]
        .filter((part) => part !== undefined && part !== null && part !== "")
        .join("_")}.xlsx`,
  );

  const url = window.URL.createObjectURL(new Blob([data]));

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);

  return "ok";
};

const validateDeliveryFrequency = async ({
  equipmentId,
  employeeId,
}: {
  equipmentId: number;
  employeeId: number;
}) => {
  const { data } = await api.get<{
    canDeliver: boolean;
    message: string;
  }>("/validate-delivery-frequency", {
    params: {
      equipmentId,
      employeeId,
    },
  });

  return data;
};

const removeHistory = async (equipmentHistoryId: number) => {
  const { data } = await api.delete(`/history/${equipmentHistoryId}`);
  return data;
};

export const EppService = {
  validateDeliveryFrequency,
  create,
  findPaginated,
  findEmployeeHistory,
  downloadFile,
  removeHistory,
};
