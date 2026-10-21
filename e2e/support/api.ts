import type { Page } from "@playwright/test";

export interface CapturedWrite {
  method: string;
  /** Ruta dentro del API, sin el prefijo /api/v1 (p. ej. "/zones/3"). */
  path: string;
  body: unknown;
}

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Intercepta toda escritura al API REST y responde como si se hubiera
 * guardado, sin tocar la base. Devuelve lo que el UI envió, en orden.
 *
 * Por omisión responde el mismo cuerpo con un id; `respond` permite dar la
 * forma que espera el UI (p. ej. un arreglo).
 */
export const captureWrites = async (
  page: Page,
  { respond }: { respond?: (write: CapturedWrite) => unknown } = {},
) => {
  const writes: CapturedWrite[] = [];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    if (!WRITE_METHODS.includes(request.method())) return route.fallback();

    let body: unknown;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    const write = {
      method: request.method(),
      path: new URL(request.url()).pathname.replace(/^.*\/api\/v1/, ""),
      body,
    };
    writes.push(write);

    const json = respond
      ? respond(write)
      : { id: 999999, ...(body && typeof body === "object" ? body : {}) };
    await route.fulfill({
      status: request.method() === "POST" ? 201 : 200,
      json,
    });
  });

  return writes;
};

/** Id del registro que el formulario está editando (?id=N en la URL). */
export const editingId = (page: Page) =>
  Number(new URL(page.url()).searchParams.get("id"));

/**
 * Responde las lecturas (GET) de una ruta del API con datos fijos, para
 * pantallas que dependen de lo que haya en la base (p. ej. eventos de hoy).
 * `when` limita el mock (p. ej. no responder la versión paginada de la lista).
 */
export const mockGet = (
  page: Page,
  path: string,
  json: unknown,
  {
    when = () => true,
    status = 200,
  }: { when?: (url: URL) => boolean; status?: number } = {},
) =>
  page.route(
    // Solo URLs del API: el UI tiene páginas con la misma ruta
    // (p. ej. /gemba-walk/calendar) y sus peticiones RSC no deben tocarse.
    (url) =>
      url.pathname.includes("/api/v1/") &&
      url.pathname.replace(/^.*\/api\/v1/, "") === path &&
      when(url),
    (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status, json })
        : route.fallback(),
  );
