import { describe, expect, test } from "vite-plus/test";

import {
  MODULE_RETRY_DELAYS_MS,
  importWithRetry,
  isModuleLoadError,
} from "../../app/_shared/utils/moduleRetry";

// Abrir una pantalla con señal débil: se reintenta solo la descarga del JS.

const chromeError = new TypeError(
  "Failed to fetch dynamically imported module: https://comportarte.com/assets/page-DlN6HSSf.js",
);

/** Falla con los errores dados y luego resuelve; registra las esperas. */
const scripted = (failures: unknown[]) => {
  const sleeps: number[] = [];
  let calls = 0;
  const load = async () => {
    const failure = failures[calls++];
    if (failure) throw failure;
    return { default: "Página" };
  };
  const sleep = async (ms: number) => {
    sleeps.push(ms);
  };
  return { load, sleep, sleeps, calls: () => calls };
};

describe("Reintentos al descargar una pantalla", () => {
  test("reconoce el fallo de descarga de cada navegador y de la precarga de CSS", () => {
    for (const error of [
      chromeError,
      new TypeError("error loading dynamically imported module: https://x/assets/page.js"),
      new TypeError("Importing a module script failed."),
      new Error("Unable to preload CSS for /assets/page-Dpj8OM-9.css"),
    ]) {
      expect(isModuleLoadError(error)).toBe(true);
    }
  });

  test("no confunde errores del código de la página con fallos de descarga", () => {
    expect(isModuleLoadError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isModuleLoadError(new TypeError("Failed to fetch"))).toBe(false);
    expect(isModuleLoadError("Failed to fetch dynamically imported module")).toBe(false);
    expect(isModuleLoadError(undefined)).toBe(false);
  });

  test("si la descarga responde a la primera, no espera", async () => {
    const run = scripted([]);
    await expect(importWithRetry(run.load, MODULE_RETRY_DELAYS_MS, run.sleep)).resolves.toEqual({
      default: "Página",
    });
    expect(run.calls()).toBe(1);
    expect(run.sleeps).toEqual([]);
  });

  test("un corte pasajero se recupera esperando 1 s y luego 3 s", async () => {
    const run = scripted([chromeError, chromeError]);
    await expect(importWithRetry(run.load, MODULE_RETRY_DELAYS_MS, run.sleep)).resolves.toEqual({
      default: "Página",
    });
    expect(run.calls()).toBe(3);
    expect(run.sleeps).toEqual([1_000, 3_000]);
  });

  test("si sigue fallando, entrega el error original para la pantalla de error", async () => {
    const run = scripted([chromeError, chromeError, chromeError, chromeError]);
    await expect(importWithRetry(run.load, MODULE_RETRY_DELAYS_MS, run.sleep)).rejects.toBe(
      chromeError,
    );
    expect(run.calls()).toBe(MODULE_RETRY_DELAYS_MS.length + 1);
  });

  test("un error del código de la página no se reintenta", async () => {
    const bug = new TypeError("Cannot read properties of undefined (reading 'map')");
    const run = scripted([bug]);
    await expect(importWithRetry(run.load, MODULE_RETRY_DELAYS_MS, run.sleep)).rejects.toBe(bug);
    expect(run.calls()).toBe(1);
    expect(run.sleeps).toEqual([]);
  });

  test("por omisión espera de verdad entre intentos", async () => {
    let calls = 0;
    const started = Date.now();
    const result = await importWithRetry(async () => {
      if (calls++ === 0) throw chromeError;
      return "ok";
    }, [20]);
    expect(result).toBe("ok");
    expect(Date.now() - started).toBeGreaterThanOrEqual(15);
  });
});
