import axiosWrapper from "./axiosWrapper";
import { Ciael } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/ciaels",
});

interface Payload {
  managerId?: string | undefined;
  accidentPositionId: string;
  zoneId: string;
  bodyPartId: string;
  atAgentId: string;
  typeOfInjuryId: string;
  atMechanismId: string;
  workingDayId: string;
  timeWorked: string;
  usualWork: boolean;
  typeOfLinkId: string;
  isDeath: boolean;
  machineId: string;
  isInside: boolean;
  associatedTaskId: string;
  areaLeaderId: string;
  riskFactorId: string;
  natureOfEventsId: string;
  daysOfDisability?: string | undefined;
  manufacturingPlantId: string;
  typeOfEventId: string;
  description: string;
  employeeId: string;
  eventDate: string;
  cieDiagnosisId: string;
}

const findAll = async () => {
  const { data } = await api.get<Ciael[]>("");
  return data;
};

// startDate / endDate: YYYY-MM-DD, rango inclusivo sobre la fecha del evento.
const findAllPaginated = async (filters: {
  manufacturingPlantId?: string;
  typeOfEventId?: string;
  zoneId?: string;
  employee?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}) => {
  const { data } = await api.get<{ data: Ciael[]; count: number }>("", {
    params: {
      page: filters.page,
      limit: filters.limit,
      ...(filters.manufacturingPlantId && {
        manufacturingPlantId: filters.manufacturingPlantId,
      }),
      ...(filters.typeOfEventId && { typeOfEventId: filters.typeOfEventId }),
      ...(filters.zoneId && { zoneId: filters.zoneId }),
      ...(filters.employee && { employee: filters.employee }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
    },
  });
  return data;
};

const create = async (payload: Payload) => {
  const { data } = await api.post<Ciael>("", payload);
  return data;
};

const downloadExcel = async () => {
  const { data } = await api.get(`/download/excel`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([data]));

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "CIAEL.xlsx");
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);

  return "ok";
};

export const CiaelsService = {
  findAll,
  findAllPaginated,
  create,
  downloadExcel,
};
