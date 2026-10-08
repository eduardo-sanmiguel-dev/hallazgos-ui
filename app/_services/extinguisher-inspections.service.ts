import axiosWrapper from "./axiosWrapper";
import { resolveDownloadFileName } from "@shared/utils/downloadFileName";
import {
  EvaluationValues,
  ExtinguisherInspection,
  ExtinguisherType,
} from "@interfaces";

interface EvaluationPayload {
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: number;
  pressureManometer: EvaluationValues;
  valve: EvaluationValues;
  hose: EvaluationValues;
  cylinder: EvaluationValues;
  barrette: EvaluationValues;
  seal: EvaluationValues;
  cornet: EvaluationValues;
  access: EvaluationValues;
  support: EvaluationValues;
  signaling: EvaluationValues;
  nextRechargeDate: string;
  maintenanceDate: string;
  observations?: string;
}

interface Payload {
  manufacturingPlantId: number;
  evaluations: EvaluationPayload[];
}

interface Filters {
  search?: string;
  manufacturingPlantId?: string;
}

const api = axiosWrapper({
  baseURL: "/extinguisher-inspections",
});

const create = async (payload: Payload) => {
  const { data } = await api.post<ExtinguisherInspection>("", payload);
  return data;
};

const findOne = async (id: number) => {
  const { data } = await api.get<ExtinguisherInspection>(`/${id}`);
  return data;
};

const update = async (id: number, payload: Payload) => {
  const { data } = await api.patch<ExtinguisherInspection>(`/${id}`, payload);
  return data;
};

const findAll = async (filters: Filters) => {
  const { data } = await api.get<ExtinguisherInspection[]>("", {
    params: {
      ...(filters?.search && { search: filters.search }),
      ...(filters?.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
    },
  });

  return data;
};

const downloadFile = async (id: number) => {
  const { data, headers } = await api.get(`/download/file/${id}`, {
    responseType: "blob",
  });

  // El back arma el nombre con la fecha de creación; respaldo: RGOSGSST49_{ID}.xlsx
  const fileName = resolveDownloadFileName(
    headers["content-disposition"],
    () => `RGOSGSST49_${id}.xlsx`,
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

export const ExtinguisherInspectionsService = {
  create,
  findOne,
  update,
  findAll,
  downloadFile,
};
