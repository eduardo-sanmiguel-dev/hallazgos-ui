import type { AxiosProgressEvent } from "axios";

import axiosWrapper, {
  idempotencyHeaders,
  submitResult,
  type SubmitResult,
} from "./axiosWrapper";
import {
  buildLocalFileNameTimestamp,
  getBrowserTimeZone,
  resolveDownloadFileName,
} from "@shared/utils/downloadFileName";
import { Evidence, EvidenceRow } from "_interfaces/evicences.interfaces";
import { FiltersEvidences } from "(routes)/hallazgos/_components/FiltersEvidence";

const baseURL = "/evidences";

const api = axiosWrapper({
  baseURL,
});

const paramsFilter = (params: FiltersEvidences) => {
  const evidenceIds = params.evidenceId
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));

  return {
    ...(evidenceIds.length === 1 && {
      id: evidenceIds[0],
    }),
    ...(evidenceIds.length > 1 && {
      ids: evidenceIds.join(","),
    }),
    ...(params.manufacturingPlantId && {
      manufacturingPlantId: params.manufacturingPlantId,
    }),
    ...(params.mainTypeIds.length > 0 && {
      mainTypeIds: params.mainTypeIds.join(","),
    }),
    ...(params.secondaryTypeIds.length > 0 && {
      secondaryTypeIds: params.secondaryTypeIds.join(","),
    }),
    ...(params.areaIds.length > 0 && {
      areaIds: params.areaIds.join(","),
    }),
    ...(params.responsibleIds.length > 0 && {
      responsibleIds: params.responsibleIds.join(","),
    }),
    ...(params.zoneIds.length > 0 && {
      zoneIds: params.zoneIds.join(","),
    }),
    ...(params.states.length > 0 && {
      statuses: params.states.join(","),
    }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  };
};

// Para mostrar el progreso de subida de la foto (ver useUploadProgress).
export interface UploadOptions {
  onUploadProgress?: (event: AxiosProgressEvent) => void;
  /**
   * Clave del envío (useIdempotencyKey): la misma en cada reintento, para que
   * el API no duplique el registro ni los correos. Sin ella se usa una nueva
   * por llamada, que igual protege el "Reintentar" del aviso.
   */
  idempotencyKey?: string;
}

const uploadConfig = (options: UploadOptions) => ({
  headers: idempotencyHeaders(options.idempotencyKey),
  onUploadProgress: options.onUploadProgress,
});

export type { SubmitResult };

interface PermissionsConfigResponse {
  supervisorOverrideEmails: string[];
  cancelEvidenceEmails: string[];
}

/** Lista de hallazgos paginada con los filtros (`page` empieza en 1). */
const findPaginated = async (
  filters: FiltersEvidences,
  { page, limit }: { page: number; limit: number },
) => {
  const { data } = await api.get<{ data: EvidenceRow[]; count: number }>("", {
    params: { page, limit, ...paramsFilter(filters) },
  });
  return data;
};

// Las subidas pasan por el interceptor (antes usaban axios directo): tiempo
// límite de 90 s, aviso por tipo de error y "Reintentar" sin perder la foto.
// Responde el id del hallazgo creado.
const create = async (
  formData: FormData,
  options: UploadOptions = {},
): Promise<SubmitResult<{ id: number }>> =>
  submitResult(
    await api.post<{ id: number }>("", formData, uploadConfig(options)),
  );

const solution = async (
  id: number,
  formData: FormData,
  options: UploadOptions = {},
): Promise<SubmitResult<Evidence>> =>
  submitResult(
    await api.post<Evidence>(
      `/solution/${id}`,
      formData,
      uploadConfig(options),
    ),
  );

const processStart = async (
  id: number,
  formData: FormData,
  options: UploadOptions = {},
): Promise<SubmitResult<Evidence>> =>
  submitResult(
    await api.post<Evidence>(`/process/${id}`, formData, uploadConfig(options)),
  );

// Cancelar, comentar y reasignar mandan correos o crean registros: también
// llevan clave para que "Reintentar" no los repita.
const remove = async (id: number) => {
  const { data } = await api.delete<Evidence>(`/${id}`, {
    headers: idempotencyHeaders(),
  });
  return data;
};

const addComment = async (id: number, comment: string) => {
  const { data } = await api.post<Evidence>(
    `/add/comment/${id}`,
    { comment },
    { headers: idempotencyHeaders() },
  );
  return data;
};

const getPermissionsConfig = async () => {
  const { data } =
    await api.get<PermissionsConfigResponse>(`/permissions/config`);
  return data;
};

const reassignResponsibles = async (id: number, responsibleIds: number[]) => {
  const { data } = await api.patch<Evidence>(
    `/reassign/${id}`,
    { responsibleIds },
    { headers: idempotencyHeaders() },
  );
  return data;
};

const downloadExcel = async (filters: FiltersEvidences) => {
  const { data, headers } = await api.get(`/download/xlsx`, {
    responseType: "blob",
    params: {
      ...paramsFilter(filters),
      timeZone: getBrowserTimeZone(),
    },
  });

  // Respaldo: Hallazgos_AAAA-MM-DD_HHmm_UTC±HH.xlsx en la hora local.
  const fileName = resolveDownloadFileName(
    headers["content-disposition"],
    () => `Hallazgos_${buildLocalFileNameTimestamp()}.xlsx`,
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

const downloadPdf = async (filters: FiltersEvidences) => {
  const { data, headers } = await api.get(`/download/pdf`, {
    responseType: "blob",
    params: {
      ...paramsFilter(filters),
      timeZone: getBrowserTimeZone(),
    },
  });

  // Mismo nombre que el Excel (lo arma el back); respaldo con la hora local.
  const fileName = resolveDownloadFileName(
    headers["content-disposition"],
    () => `Hallazgos_${buildLocalFileNameTimestamp()}.pdf`,
    ".pdf",
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

export const EvidencesService = {
  findPaginated,
  create,
  remove,
  solution,
  processStart,
  addComment,
  getPermissionsConfig,
  reassignResponsibles,
  downloadExcel,
  downloadPdf,
};
