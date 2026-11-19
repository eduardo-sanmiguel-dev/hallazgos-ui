import { IFiltersHds } from "@routes/hds/page";
import type { AxiosProgressEvent } from "axios";
import axiosWrapper from "./axiosWrapper";
import { Hds } from "@interfaces";
import { sortQueryParams, type SortQuery } from "@shared/utils/tableSort";

const api = axiosWrapper({
  baseURL: "/safety-data-files",
});

const findAllPaginated = async ({
  name,
  page,
  limit,
  orderBy,
  order,
}: IFiltersHds & { page: number; limit: number } & SortQuery) => {
  const { data } = await api.get<{ data: Hds[]; count: number }>("", {
    params: {
      page,
      limit,
      ...sortQueryParams({ orderBy, order }),
      ...(name?.trim() && { name: name.trim() }),
    },
  });
  return data;
};

const downloadFile = async (name: string) => {
  // Como parámetro para que se codifique (nombres con "&", "#", espacios...).
  const { data } = await api.get<Blob>("download", {
    params: { name },
    responseType: "blob",
  });
  const file = new Blob([data], { type: "application/pdf" });
  const fileURL = URL.createObjectURL(file);

  // Abrir en nueva pestaña
  window.open(fileURL, "_blank");
};

interface UploadOptions {
  onUploadProgress?: (event: AxiosProgressEvent) => void;
}

const pdfForm = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
};

/** Sube una HDS nueva (solo administradores); el nombre es el del archivo. */
const upload = async (file: File, options: UploadOptions = {}) => {
  const { data } = await api.post<Hds>("", pdfForm(file), {
    onUploadProgress: options.onUploadProgress,
  });
  return data;
};

/** Reemplaza el PDF de una HDS existente (conserva su nombre). */
const replace = async (id: number, file: File, options: UploadOptions = {}) => {
  const { data } = await api.put<Hds>(`/${id}/file`, pdfForm(file), {
    onUploadProgress: options.onUploadProgress,
  });
  return data;
};

const remove = async (id: number) => {
  const { data } = await api.delete<{ id: number; name: string }>(`/${id}`);
  return data;
};

export const HdsService = {
  findAllPaginated,
  downloadFile,
  upload,
  replace,
  remove,
};
