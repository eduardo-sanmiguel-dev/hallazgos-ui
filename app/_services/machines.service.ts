import axiosWrapper from "./axiosWrapper";
import { Machine } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/machines",
});

const findAll = async ({ manufacturingPlantId }: { manufacturingPlantId: string }) => {
  const { data } = await api.get<Machine[]>("", {
    params: { manufacturingPlantId },
  });
  return data;
};

export const MachinesService = {
  findAll,
};
