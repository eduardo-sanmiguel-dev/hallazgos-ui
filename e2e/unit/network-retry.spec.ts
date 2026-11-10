import { describe, expect, test } from "vite-plus/test";

import {
  NETWORK_RETRIES,
  isNetworkError,
  networkRetryDelay,
  retryNetworkErrors,
} from "../../app/_shared/utils/networkRetry";

// Verificación de sesión: solo se reintentan los cortes de red.

describe("Reintentos ante cortes de red", () => {
  test("un corte de red es TypeError en cualquier navegador", () => {
    for (const message of [
      "Failed to fetch",
      "NetworkError when attempting to fetch resource.",
      "Load failed",
    ]) {
      expect(isNetworkError(new TypeError(message))).toBe(true);
    }
  });

  test("no reintenta lo que sí tuvo respuesta ni el tiempo límite", () => {
    expect(retryNetworkErrors(0, new Error("No se pudo verificar la sesión."))).toBe(false);
    expect(retryNetworkErrors(0, new DOMException("signal timed out", "TimeoutError"))).toBe(false);
    expect(retryNetworkErrors(0, new SyntaxError("JSON inválido"))).toBe(false);
  });

  test(`reintenta un corte de red hasta ${NETWORK_RETRIES} veces`, () => {
    const cut = new TypeError("Failed to fetch");
    expect(retryNetworkErrors(0, cut)).toBe(true);
    expect(retryNetworkErrors(1, cut)).toBe(true);
    expect(retryNetworkErrors(2, cut)).toBe(false);
  });

  test("espera 0.5 s y luego 1.5 s", () => {
    expect(networkRetryDelay(1)).toBe(500);
    expect(networkRetryDelay(2)).toBe(1500);
    expect(networkRetryDelay(5)).toBe(1500);
  });
});
