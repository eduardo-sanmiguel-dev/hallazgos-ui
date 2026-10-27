import { expect, test } from "@playwright/test";
import { AxiosError, AxiosHeaders } from "axios";

import {
  keepsIdempotencyKey,
  parseApiError,
} from "../../app/_services/apiError";

// Clasificación de los errores del API (formato único de la Fase 3) para
// titular el aviso y decidir la acción.

const httpError = (status: number, data: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const networkError = (code: string) => new AxiosError("Network Error", code);

test.describe("parseApiError", () => {
  test("validación: título propio, resumen y errores por campo", () => {
    const parsed = parseApiError(
      httpError(400, {
        statusCode: 400,
        code: "VALIDATION_FAILED",
        message: "Revisa 2 campos: Ubicación y Capacidad.",
        errors: {
          location: "Debe tener entre 5 y 150 caracteres.",
          capacity: "Debe ser 1 o mayor.",
        },
      }),
    );

    expect(parsed).toMatchObject({
      kind: "validation",
      title: "Revisa los datos",
      message: "Revisa 2 campos: Ubicación y Capacidad.",
      fieldErrors: {
        location: "Debe tener entre 5 y 150 caracteres.",
        capacity: "Debe ser 1 o mayor.",
      },
    });
  });

  for (const [code, status, kind, title] of [
    ["SESSION_EXPIRED", 401, "session", "Tu sesión terminó"],
    ["INVALID_CREDENTIALS", 401, "credentials", "No se pudo iniciar sesión"],
    ["FORBIDDEN", 403, "forbidden", "Sin permiso"],
    ["NOT_FOUND", 404, "notFound", "No encontrado"],
    ["CONFLICT", 409, "conflict", "No se pudo completar"],
    ["IDEMPOTENCY_IN_PROGRESS", 409, "inProgress", "Confirmando envío"],
    ["IDEMPOTENCY_UNCONFIRMED", 409, "unconfirmed", "Envío sin confirmar"],
    ["TOO_MANY_REQUESTS", 429, "rateLimit", "Demasiados intentos"],
  ] as const) {
    test(`código ${code} → ${kind}`, () => {
      const parsed = parseApiError(
        httpError(status, { statusCode: status, code, message: "Texto" }),
      );
      expect({ kind: parsed.kind, title: parsed.title }).toEqual({
        kind,
        title,
      });
    });
  }

  test("error 500: conserva la referencia para dictarla o copiarla", () => {
    const parsed = parseApiError(
      httpError(500, {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado… referencia E-7K3Q9P.",
        ref: "E-7K3Q9P",
      }),
    );

    expect(parsed).toMatchObject({
      kind: "server",
      title: "Error del servidor",
      ref: "E-7K3Q9P",
    });
  });

  test("API anterior (sin code, message como arreglo): por estatus y en un solo texto", () => {
    const parsed = parseApiError(
      httpError(400, { message: ["zone should not be empty", "otro"] }),
    );
    expect(parsed).toMatchObject({
      kind: "validation",
      message: "zone should not be empty otro",
      fieldErrors: {},
    });
  });

  test("413 de nginx en HTML: mensaje propio, sin mostrar el HTML", () => {
    const parsed = parseApiError(
      httpError(413, "<html><body>413 Request Entity Too Large</body></html>"),
    );
    expect(parsed).toMatchObject({
      kind: "tooLarge",
      title: "Archivo muy pesado",
      message: "La foto pesa demasiado para enviarse.",
    });
  });

  test("sin respuesta: 'Sin conexión'; tiempo límite: 'Tiempo agotado'", () => {
    expect(parseApiError(networkError("ERR_NETWORK"))).toMatchObject({
      kind: "offline",
      title: "Sin conexión",
    });
    expect(parseApiError(networkError("ECONNABORTED"))).toMatchObject({
      kind: "timeout",
      title: "Tiempo agotado",
    });
  });

  test("la clave de envío se conserva solo cuando el servidor quizá lo recibió", () => {
    expect(keepsIdempotencyKey(networkError("ERR_NETWORK"))).toBe(true);
    expect(keepsIdempotencyKey(networkError("ECONNABORTED"))).toBe(true);
    expect(keepsIdempotencyKey(httpError(500, { code: "INTERNAL_ERROR" }))).toBe(
      true,
    );
    expect(
      keepsIdempotencyKey(httpError(409, { code: "IDEMPOTENCY_IN_PROGRESS" })),
    ).toBe(true);

    expect(
      keepsIdempotencyKey(httpError(400, { code: "VALIDATION_FAILED" })),
    ).toBe(false);
    expect(
      keepsIdempotencyKey(httpError(409, { code: "IDEMPOTENCY_UNCONFIRMED" })),
    ).toBe(false);
    expect(keepsIdempotencyKey(httpError(403, { code: "FORBIDDEN" }))).toBe(
      false,
    );
  });
});
