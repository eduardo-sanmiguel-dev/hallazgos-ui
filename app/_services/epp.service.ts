import { Epp, PayloadCreateEpp } from "@interfaces";
import axiosWrapper from "./axiosWrapper";

const api = axiosWrapper({
  baseURL: "/epps",
});

const create = async (payload: PayloadCreateEpp) => {
  const { data } = await api.post("", payload);
  return data;
};

const findAll = async ({
  manufacturingPlantId,
}: {
  manufacturingPlantId: string;
}) => {
  const { data } = await api.get<Epp[]>("", {
    params: {
      manufacturingPlantId,
    },
  });
  return data;
};

const downloadFile = async (employeeId: number) => {
  const { data } = await api.get(`/download/file/${employeeId}`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([data]));

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "formatoEPP.xlsx");
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
  findAll,
  downloadFile,
  removeHistory,
};
