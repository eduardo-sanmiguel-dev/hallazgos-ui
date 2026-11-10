// Reintentos ante cortes de red: la petición no recibió respuesta HTTP
// (fetch lanza TypeError: "Failed to fetch" en Chrome/Edge, "NetworkError…"
// en Firefox, "Load failed" en Safari). En redes corporativas o móviles a
// veces falla una sola petición y la siguiente responde normal.
//
// No se reintenta lo que sí tuvo respuesta (401/403/5xx: lo decide quien
// llama) ni el tiempo límite (DOMException TimeoutError): reintentar una
// espera de 30 s solo alargaría el fallo.

export const NETWORK_RETRIES = 2;
const NETWORK_RETRY_DELAYS_MS = [500, 1500];

export const isNetworkError = (error: unknown): boolean => error instanceof TypeError;

/** `retry` de TanStack Query: solo cortes de red, hasta NETWORK_RETRIES veces. */
export const retryNetworkErrors = (failureCount: number, error: unknown): boolean =>
  failureCount < NETWORK_RETRIES && isNetworkError(error);

/** `retryDelay` de TanStack Query (failureCount empieza en 1). */
export const networkRetryDelay = (failureCount: number): number =>
  NETWORK_RETRY_DELAYS_MS[Math.min(failureCount, NETWORK_RETRY_DELAYS_MS.length) - 1];
