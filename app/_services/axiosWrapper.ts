import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { ApiErrorBody, ParsedApiError, parseApiError } from "./apiError";
import { notifySessionEnded } from "./sessionEvents";

// Tiempos límite: subir una foto de hasta 2 MB con señal 3G lenta; el resto,
// 30 s. Las descargas (Excel, PDF) arman el archivo en el servidor y tardan
// más.
export const UPLOAD_TIMEOUT_MS = 90_000;
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DOWNLOAD_TIMEOUT_MS = 120_000;

// "Tu envío anterior todavía se está procesando": se reintenta solo.
const IN_PROGRESS_RETRY_MS = 3_000;
const IN_PROGRESS_MAX_RETRIES = 5;

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

/** Header de idempotencia; sin clave, una nueva para esta llamada. */
export const idempotencyHeaders = (key?: string) => ({
  [IDEMPOTENCY_HEADER]: key ?? uuidv4(),
});

interface IAxiosWrapperProps {
  baseURL: string;
}

type RetryableConfig = InternalAxiosRequestConfig & {
  inProgressRetries?: number;
};

/** El error ya se mostró (interceptor): `handleErrorResponse` no repite. */
const NOTIFIED = Symbol("notified");

const markNotified = (error: unknown) => {
  if (error && typeof error === "object") {
    (error as Record<symbol, boolean>)[NOTIFIED] = true;
  }
};

const isNotified = (error: unknown) =>
  !!(error as Record<symbol, boolean> | undefined)?.[NOTIFIED];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isLoginPage = () =>
  typeof window !== "undefined" && window.location.pathname === "/";

/** Aviso con el título del tipo de error (antes "¡ Atención !" para todo). */
export const notifyApiError = (parsed: ParsedApiError) => {
  const ref = parsed.ref;

  toast.error(parsed.title, {
    // Uno solo aunque fallen varias consultas a la vez sin conexión.
    id: parsed.kind === "offline" ? "api-offline" : undefined,
    description: parsed.message,
    duration: parsed.kind === "server" ? 15_000 : 7_000,
    ...(ref && {
      action: {
        label: "Copiar referencia",
        onClick: () => {
          navigator.clipboard?.writeText(ref).catch(() => undefined);
        },
      },
    }),
  });
};

/**
 * Sin conexión o tiempo agotado al guardar: el aviso trae "Reintentar", que
 * reenvía la misma petición (mismo FormData con la foto y misma clave de
 * idempotencia). Mientras tanto la promesa de la pantalla sigue pendiente,
 * así que el formulario no se limpia. Si el aviso se cierra, se rechaza.
 */
const offerRetry = (
  instance: AxiosInstance,
  config: InternalAxiosRequestConfig,
  error: AxiosError,
  parsed: ParsedApiError,
) =>
  new Promise((resolve, reject) => {
    let retried = false;

    toast.error(parsed.title, {
      description: parsed.message,
      duration: Infinity,
      closeButton: true,
      action: {
        label: "Reintentar",
        onClick: () => {
          retried = true;
          instance.request(config).then(resolve, reject);
        },
      },
      onDismiss: () => {
        if (!retried) {
          markNotified(error);
          reject(error);
        }
      },
    });
  });

/** Mutaciones que se pueden repetir sin duplicar: con clave o no-POST. */
const canRetry = (config?: InternalAxiosRequestConfig) => {
  if (!config) return false;
  const method = (config.method ?? "get").toLowerCase();
  if (method === "get") return false;
  return method !== "post" || !!config.headers?.get?.(IDEMPOTENCY_HEADER);
};

const handleError = async (
  instance: AxiosInstance,
  error: AxiosError<ApiErrorBody>,
) => {
  if (axios.isCancel(error)) throw error;

  const parsed = parseApiError(error);
  const config = error.config as RetryableConfig | undefined;

  if (parsed.kind === "session" && !isLoginPage()) {
    notifySessionEnded();
    markNotified(error);
    throw error;
  }

  if (parsed.kind === "inProgress" && config) {
    const retries = config.inProgressRetries ?? 0;
    if (retries < IN_PROGRESS_MAX_RETRIES) {
      toast.loading(parsed.title, {
        id: "api-in-progress",
        description: "Esperando la confirmación del envío anterior…",
      });
      await sleep(IN_PROGRESS_RETRY_MS);
      config.inProgressRetries = retries + 1;
      try {
        return await instance.request(config);
      } finally {
        toast.dismiss("api-in-progress");
      }
    }
  }

  if (
    (parsed.kind === "offline" || parsed.kind === "timeout") &&
    canRetry(config)
  ) {
    return offerRetry(instance, config!, error, parsed);
  }

  notifyApiError(parsed);
  markNotified(error);
  throw error;
};

/**
 * Para pantallas que encadenan `.catch(handleErrorResponse)`: muestra el error
 * si el interceptor no lo mostró ya, y lo vuelve a rechazar.
 */
export const handleErrorResponse = (error: AxiosError<ApiErrorBody>) => {
  if (!isNotified(error)) {
    const parsed = parseApiError(error);

    if (parsed.kind === "session" && !isLoginPage()) {
      notifySessionEnded();
    } else {
      notifyApiError(parsed);
    }
    markNotified(error);
  }

  return Promise.reject(error);
};

const timeoutFor = (config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) return UPLOAD_TIMEOUT_MS;
  if (config.responseType === "blob" || config.responseType === "arraybuffer")
    return DOWNLOAD_TIMEOUT_MS;
  return DEFAULT_TIMEOUT_MS;
};

export default function axiosWrapper({
  baseURL,
}: IAxiosWrapperProps): AxiosInstance {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_URL_API + baseURL,
  });

  api.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
    config.headers["Accept"] = "application/json";
    // Con FormData (fotos) el navegador pone multipart con su boundary; con
    // JSON forzado, axios convertiría el FormData a JSON.
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    config.headers["x-app-key"] = process.env.NEXT_PUBLIC_APP_KEY;

    config.withCredentials = true;
    config.timeout = config.timeout || timeoutFor(config);

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => handleError(api, error),
  );

  return api;
}
