import { Session } from "node:inspector/promises";
import { fileURLToPath } from "node:url";

import { CoverageReport } from "monocart-coverage-reports";
import { afterAll, beforeAll } from "vite-plus/test";

import { coverageOptions } from "../support/coverage";

/**
 * Con UNIT_COVERAGE=1 (lo activa pnpm test:e2e:coverage), cada archivo de
 * pruebas unitarias graba su coverage V8 con el inspector de Node y lo suma
 * al mismo reporte que los e2e. Así la lógica que el navegador de pruebas no
 * ejecuta (p. ej. RUM, apagado en localhost) cuenta igual.
 */
const session = new Session();

/**
 * Source map en línea que deja Vite en el módulo transformado. Sus `sources`
 * vienen relativos ("rumUser.ts"): se pasan a la ruta del archivo para que el
 * reporte los junte con los mismos archivos de los e2e (app/...).
 */
const inlineSourceMap = (url: string, source: string) => {
  // Vitest envuelve el módulo en una función: el comentario no queda al final.
  const match = [
    ...source.matchAll(
      /\/\/# sourceMappingURL=data:application\/json[^,]*;base64,([A-Za-z0-9+/=]+)/g,
    ),
  ].at(-1);
  if (!match) return undefined;
  const map = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
  return { ...map, sources: [fileURLToPath(url)] };
};

beforeAll(async () => {
  session.connect();
  await session.post("Profiler.enable");
  await session.post("Debugger.enable");
  await session.post("Profiler.startPreciseCoverage", { callCount: true, detailed: true });
});

afterAll(async () => {
  const { result } = await session.post("Profiler.takePreciseCoverage");
  await session.post("Profiler.stopPreciseCoverage");
  const entries = [];
  for (const entry of result) {
    if (!entry.url.includes("/app/") || entry.url.includes("node_modules")) continue;
    const { scriptSource } = await session.post("Debugger.getScriptSource", {
      scriptId: entry.scriptId,
    });
    entries.push({
      ...entry,
      source: scriptSource,
      sourceMap: inlineSourceMap(entry.url, scriptSource),
    });
  }
  session.disconnect();
  if (entries.length) await new CoverageReport(coverageOptions).add(entries);
});
