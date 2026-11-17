import { IFiltersHds } from "@routes/hds/page";
import axiosWrapper from "./axiosWrapper";
import { Hds } from "@interfaces";
import { sortQueryParams, type SortQuery } from "@shared/utils/tableSort";

const api = axiosWrapper({
  baseURL: "/safety-data-files",
});

const findAll = async ({ name }: IFiltersHds) => {
  const { data } = await api.get<Hds[]>("", {
    params: {
      ...(name && { name }),
    },
  });
  return data;
};

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

export const HdsService = {
  findAll,
  findAllPaginated,
  downloadFile,
};
