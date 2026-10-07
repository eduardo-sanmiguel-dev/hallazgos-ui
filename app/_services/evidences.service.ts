import axios from "axios";

import axiosWrapper from "./axiosWrapper";
import { Evidence } from "_interfaces/evicences.interfaces";
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

interface PermissionsConfigResponse {
  supervisorOverrideEmails: string[];
  cancelEvidenceEmails: string[];
}

const findAll = async (params: FiltersEvidences) => {
  const { data } = await api.get<Evidence[]>("", {
    params: paramsFilter(params),
  });
  return data;
};

const create = async (formData: FormData) => {
  const { data } = await axios.post<Evidence>(
    `${process.env.NEXT_PUBLIC_URL_API}${baseURL}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ["x-app-key"]: process.env.NEXT_PUBLIC_APP_KEY,
      },
      withCredentials: true,
    },
  );
  return data;
};

const solution = async (id: number, formData: FormData) => {
  const { data } = await axios.post<Evidence>(
    `${process.env.NEXT_PUBLIC_URL_API}${baseURL}/solution/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ["x-app-key"]: process.env.NEXT_PUBLIC_APP_KEY,
      },
      withCredentials: true,
    },
  );
  return data;
};

const processStart = async (id: number, formData: FormData) => {
  const { data } = await axios.post<Evidence>(
    `${process.env.NEXT_PUBLIC_URL_API}${baseURL}/process/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        ["x-app-key"]: process.env.NEXT_PUBLIC_APP_KEY,
      },
      withCredentials: true,
    },
  );
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<Evidence>(`/${id}`);
  return data;
};

const addComment = async (id: number, comment: string) => {
  const { data } = await api.post<Evidence>(`/add/comment/${id}`, { comment });
  return data;
};

const getPermissionsConfig = async () => {
  const { data } =
    await api.get<PermissionsConfigResponse>(`/permissions/config`);
  return data;
};

const reassignResponsibles = async (id: number, responsibleIds: number[]) => {
  const { data } = await api.patch<Evidence>(`/reassign/${id}`, {
    responsibleIds,
  });
  return data;
};

// Nombre de respaldo armado en el navegador:
// Hallazgos_AAAA-MM-DD_HHmm_UTC±HH.xlsx en la hora local del usuario.
const buildFallbackExcelName = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetAbs = Math.abs(offsetMinutes);
  const offset = `UTC${offsetMinutes < 0 ? "-" : "+"}${pad(
    Math.floor(offsetAbs / 60),
  )}${offsetAbs % 60 ? pad(offsetAbs % 60) : ""}`;

  return `Hallazgos_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}_${offset}.xlsx`;
};

const getFileNameFromContentDisposition = (
  contentDisposition: string | undefined,
) => {
  if (!contentDisposition) return "";

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Si viene mal codificado se usa filename=
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return plain ? plain[1].trim() : "";
};

const downloadExcel = async (filters: FiltersEvidences) => {
  const { data, headers } = await api.get(`/download/xlsx`, {
    responseType: "blob",
    params: {
      ...paramsFilter(filters),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const headerFileName = getFileNameFromContentDisposition(
    headers["content-disposition"],
  );
  const fileName = /\.xlsx$/i.test(headerFileName)
    ? headerFileName
    : buildFallbackExcelName();

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
  const { data } = await api.get(`/download/pdf`, {
    responseType: "blob",
    params: paramsFilter(filters),
  });
  const url = window.URL.createObjectURL(new Blob([data]));

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Hallazgos.pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return "ok";
};

export const EvidencesService = {
  findAll,
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
