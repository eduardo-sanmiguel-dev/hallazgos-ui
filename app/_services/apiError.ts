import { AxiosError } from "axios";

/**
 * Cuerpo de error del API (formato único de la Fase 3). `code` y `errors`
 * pueden faltar si responde una versión anterior del API o un proxy (por
 * ejemplo, un 413 de nginx en HTML).
 */
export interface ApiErrorBody {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  errors?: Record<string, string>;
  ref?: string;
}

export type ApiErrorKind =
  | "offline"
  | "timeout"
  | "validation"
  | "session"
  | "credentials"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "inProgress"
  | "unconfirmed"
  | "tooLarge"
  | "rateLimit"
  | "server"
  | "unknown";

export interface ParsedApiError {
  kind: ApiErrorKind;
  /** Título del aviso según el tipo de error. */
  title: string;
  /** Mensaje en español para el usuario. */
  message: string;
  /** Solo en validación: ruta del campo → mensaje (sin la etiqueta). */
  fieldErrors: Record<string, string>;
  /** Referencia del error 500 (también está en el log del API). */
  ref?: string;
  status?: number;
  code?: string;
}

export const TITLES: Record<ApiErrorKind, string> = {
  offline: "Sin conexión",
  timeout: "Tiempo agotado",
  validation: "Revisa los datos",
  session: "Tu sesión terminó",
  credentials: "No se pudo iniciar sesión",
  forbidden: "Sin permiso",
  notFound: "No encontrado",
  conflict: "No se pudo completar",
  inProgress: "Confirmando envío",
  unconfirmed: "Envío sin confirmar",
  tooLarge: "Archivo muy pesado",
  rateLimit: "Demasiados intentos",
  server: "Error del servidor",
  unknown: "No se pudo completar",
};

const DEFAULT_MESSAGES: Partial<Record<ApiErrorKind, string>> = {
  offline:
    "No hay conexión con el servidor. Lo que capturaste sigue aquí; reintenta cuando tengas señal.",
  timeout:
    "El envío tardó demasiado. Revisa tu señal y reintenta; lo que capturaste sigue aquí.",
  session: "Tu sesión terminó. Inicia sesión de nuevo.",
  forbidden: "No tienes permiso para realizar esta acción.",
  notFound: "No se encontró lo que buscas.",
  tooLarge: "La foto pesa demasiado para enviarse.",
  rateLimit: "Demasiados intentos. Espera un minuto e intenta de nuevo.",
  server:
    "Ocurrió un error inesperado. Intenta de nuevo; si continúa, avisa al administrador.",
  unknown:
    "Se produjo un error al procesar su solicitud, inténtelo nuevamente más tarde.",
};

const KIND_BY_CODE: Record<string, ApiErrorKind> = {
  VALIDATION_FAILED: "validation",
  SESSION_EXPIRED: "session",
  INVALID_CREDENTIALS: "credentials",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "notFound",
  CONFLICT: "conflict",
  PAYLOAD_TOO_LARGE: "tooLarge",
  TOO_MANY_REQUESTS: "rateLimit",
  INTERNAL_ERROR: "server",
  IDEMPOTENCY_IN_PROGRESS: "inProgress",
  IDEMPOTENCY_UNCONFIRMED: "unconfirmed",
};

/** Sin `code` (API anterior o proxy): por estatus. */
const kindByStatus = (status: number): ApiErrorKind => {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "session";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 413) return "tooLarge";
  if (status === 429) return "rateLimit";
  if (status >= 500) return "server";
  return "unknown";
};

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** Clasifica un error de axios (o cualquier otro) para mostrarlo. */
export const parseApiError = (error: unknown): ParsedApiError => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  const response = axiosError?.response;

  if (!response) {
    const isTimeout =
      axiosError?.code === AxiosError.ECONNABORTED ||
      axiosError?.code === AxiosError.ETIMEDOUT;
    const kind: ApiErrorKind =
      isTimeout && !isOffline() ? "timeout" : "offline";

    return {
      kind,
      title: TITLES[kind],
      message: DEFAULT_MESSAGES[kind]!,
      fieldErrors: {},
    };
  }

  // Un proxy puede responder HTML o texto: solo se usa un cuerpo JSON.
  const body: ApiErrorBody =
    response.data && typeof response.data === "object" ? response.data : {};
  const status = response.status;
  const kind =
    (body.code && KIND_BY_CODE[body.code]) ||
    // 422 de una clave reusada: es un error de la app, no de los datos.
    (body.code === "IDEMPOTENCY_KEY_MISMATCH" ? "unknown" : undefined) ||
    kindByStatus(status);
  const rawMessage = Array.isArray(body.message)
    ? body.message.join(" ")
    : body.message;

  return {
    kind,
    title: TITLES[kind],
    message: rawMessage || DEFAULT_MESSAGES[kind] || DEFAULT_MESSAGES.unknown!,
    fieldErrors:
      body.errors && typeof body.errors === "object" ? body.errors : {},
    ref: body.ref,
    status,
    code: body.code,
  };
};

/**
 * Errores después de los cuales el mismo envío se puede repetir con la misma
 * clave de idempotencia: el servidor quizá lo recibió (sin conexión, tiempo
 * agotado, error 500) o lo sigue procesando.
 */
export const keepsIdempotencyKey = (error: unknown) =>
  ["offline", "timeout", "server", "inProgress"].includes(
    parseApiError(error).kind,
  );
