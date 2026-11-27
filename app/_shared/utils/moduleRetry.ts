// Reintentos al abrir una pantalla cuyo JS no se pudo descargar. En planta,
// con señal débil, a veces una descarga se cuelga (~60 s) y el import() de la
// página falla aunque el archivo exista; la siguiente descarga responde
// normal. Antes se mostraba "No se pudo mostrar esta página" y había que
// pulsar "Reintentar" (recarga completa).
//
// Solo se reintenta la descarga de módulos; un error dentro del código de la
// página se muestra de inmediato.

export const MODULE_RETRY_DELAYS_MS = [1_000, 3_000];

// Chrome/Edge: "Failed to fetch dynamically imported module: <url>".
// Firefox: "error loading dynamically imported module: <url>".
// Safari: "Importing a module script failed.".
// Vite (precarga de CSS de la página): "Unable to preload CSS for <url>".
const MODULE_LOAD_ERROR =
  /dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export const isModuleLoadError = (error: unknown): boolean =>
  error instanceof Error && MODULE_LOAD_ERROR.test(error.message);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Ejecuta `load` y lo repite tras cada espera de `delays` si falla la descarga. */
export async function importWithRetry<T>(
  load: () => Promise<T>,
  delays: readonly number[] = MODULE_RETRY_DELAYS_MS,
  sleep: (ms: number) => Promise<void> = wait,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await load();
    } catch (error) {
      if (attempt >= delays.length || !isModuleLoadError(error)) throw error;
      await sleep(delays[attempt]);
    }
  }
}
