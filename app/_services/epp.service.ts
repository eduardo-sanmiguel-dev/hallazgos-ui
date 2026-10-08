import { EppsPage, PayloadCreateEpp, QueryEpps } from "@interfaces";
import axiosWrapper from "./axiosWrapper";
import {
  buildLocalFileNameTimestamp,
  getBrowserTimeZone,
  resolveDownloadFileName,
} from "@shared/utils/downloadFileName";

const api = axiosWrapper({
  baseURL: "/epps",
});

const create = async (payload: PayloadCreateEpp) => {
  const { data } = await api.post("", payload);
  return data;
};

const findPaginated = async ({ search, ...query }: QueryEpps) => {
  const { data } = await api.get<EppsPage>("", {
    params: {
      ...query,
      ...(search?.trim() && { search: search.trim() }),
    },
  });
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
  downloadFile,
  removeHistory,
};
