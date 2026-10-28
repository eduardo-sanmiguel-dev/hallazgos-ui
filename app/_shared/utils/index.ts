import { EvidenceGraphql } from "@hooks";
import { STATUS_CLOSED } from "@shared/constants";
import dayjs from "@shared/libs/dayjs";
import { toast } from "sonner";

export const nowDateWithTime = () => dayjs().format("DD/MM/YYYY h:mm a");

export const notify = (message: string, success?: boolean) => {
  if (success) {
    toast.success("¡Correcto!", {
      description: message,
      duration: 7000,
    });
  } else {
    toast.error("¡Atención!", {
      description: message,
      duration: 7000,
    });
  }
};

export const isValidEmail = (email: string) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

export const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(",");

  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

export const baseUrlImage = (image: string, path?: string) => {
  if (!path) {
    path = "/static/images/evidences/";
  }

  console.log({ image });

  const apiBaseUrl = process.env.NEXT_PUBLIC_URL_API_RAW;
  const url = `${apiBaseUrl}${path}${image}`;

  if (image.startsWith("seed")) {
    return "/images/sin-imagen.jpg";
  }

  return url;
};

export { stringToDate, stringToDateWithTime, updatedDateLabel } from "./dates";

export const durantionToTime = (row: EvidenceGraphql) => {
  const { createdAt, solutionDate, status } = row;

  if (!solutionDate || status !== STATUS_CLOSED) return "";

  const totalSeconds = Math.max(
    0,
    dayjs(solutionDate).diff(dayjs(createdAt), "second"),
  );

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : "",
    seconds ? `${seconds}s` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "0s";
};

export const stringYYYYMMDDToDDMMYYYY = (dateString: string) => {
  const date = dateString.split("T")[0].split("-");
  return `${date[2]}/${date[1]}/${date[0]}`;
};

export { resolveTriStateSort } from "./triStateSort";
export type { SortOrder } from "./triStateSort";
