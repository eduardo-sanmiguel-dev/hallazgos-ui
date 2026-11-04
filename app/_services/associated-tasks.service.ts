import axiosWrapper from "./axiosWrapper";
import { AssociatedTask } from "@interfaces";

const api = axiosWrapper({
  baseURL: "/associated-tasks",
});

const findAll = async ({ manufacturingPlantId }: { manufacturingPlantId: string }) => {
  const { data } = await api.get<AssociatedTask[]>("", {
    params: { manufacturingPlantId },
  });
  return data;
};

export const AssociatedTasksService = {
  findAll,
};
