import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

import type { CoverageReportOptions } from "monocart-coverage-reports";
import ts from "typescript";

const UI_ROOT = join(__dirname, "..", "..");

// Corren solo en el servidor (no llegan al navegador) o son solo tipos.
const NOT_MEASURABLE = ["app/_interfaces/", "app/manifest.ts"];

/** Ruta relativa al UI ("app/..."), venga del source map o del disco. */
const toAppPath = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.indexOf("app/");
  return index >= 0 ? normalized.slice(index) : normalized;
};

/**
 * Archivos que solo reexportan (`export ... from`): el bundler los elimina, así
 * que siempre saldrían sin cubrir aunque se use todo lo que exportan.
 */
const isReexportOnly = (sourcePath: string) =>
  readFileSync(join(UI_ROOT, sourcePath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .every((statement) =>
      /^export\s+(type\s+)?(\*(\s+as\s+\w+)?|\{[\s\S]*\})\s+from\s+["'][^"']+["']$/.test(statement),
    );

const isOwnSource = (filePath: string) => {
  const sourcePath = toAppPath(filePath);
  return (
    sourcePath.startsWith("app/") &&
    !filePath.includes("node_modules") &&
    !sourcePath.endsWith(".d.ts") &&
    !NOT_MEASURABLE.some((prefix) => sourcePath.startsWith(prefix)) &&
    // Next también publica fuentes internas bajo ".../app/...".
    existsSync(join(UI_ROOT, sourcePath)) &&
    !isReexportOnly(sourcePath)
  );
};

/**
 * Coverage V8 del código propio del UI (app/) medido en el navegador durante
 * los e2e. Los source maps del dev server llevan cada chunk a su archivo .tsx;
 * los archivos que ninguna prueba cargó cuentan con 0%.
 */
export const coverageOptions: CoverageReportOptions = {
  name: "Coverage e2e - hallazgos-ui",
  outputDir: "./coverage",
  reports: ["v8", "console-summary", "lcovonly"],
  entryFilter: (entry) =>
    (entry.url.includes("/app/") || entry.url.includes("/assets/")) &&
    !entry.url.includes("node_modules"),
  // El servidor de pruebas no publica los .map (en producción son privados):
  // se leen del build en disco (dist.e2e/assets/...).
  sourceMapResolver: async (url, defaultResolver) => {
    const { pathname } = new URL(url);
    const file = join(UI_ROOT, "dist.e2e", decodeURIComponent(pathname));
    return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : defaultResolver(url);
  },
  sourceFilter: isOwnSource,
  sourcePath: toAppPath,
  // Descarta chunks sin source map (Next, librerías) que pasan tal cual.
  outputFilter: (file) => isOwnSource(file.sourcePath),
  all: {
    dir: ["./app"],
    filter: (filePath: string) => /\.tsx?$/.test(filePath) && "js",
    transformer: async (entry) => {
      const fileName = fileURLToPath(entry.url);
      const { outputText, sourceMapText } = ts.transpileModule(entry.source, {
        fileName,
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          sourceMap: true,
        },
      });
      entry.sourceMap = {
        ...JSON.parse(sourceMapText!),
        sources: [fileName],
        sourcesContent: [entry.source],
      };
      entry.source = outputText;
    },
  },
};
