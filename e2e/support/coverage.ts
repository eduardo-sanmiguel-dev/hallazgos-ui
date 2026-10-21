import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

import type { CoverageReportOptions } from "monocart-coverage-reports";
import ts from "typescript";

const UI_ROOT = join(__dirname, "..", "..");

// Corren solo en el servidor (no llegan al navegador) o son solo tipos.
const NOT_MEASURABLE = [
  "app/_interfaces/",
  "app/layout.tsx",
  "app/manifest.ts",
  "app/not-found.tsx",
  "app/privacy/page.tsx",
];

/** Ruta relativa al UI ("app/..."), venga del source map o del disco. */
const toAppPath = (filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.indexOf("app/");
  return index >= 0 ? normalized.slice(index) : normalized;
};

const isOwnSource = (filePath: string) => {
  const sourcePath = toAppPath(filePath);
  return (
    sourcePath.startsWith("app/") &&
    !filePath.includes("node_modules") &&
    !sourcePath.endsWith(".d.ts") &&
    !NOT_MEASURABLE.some((prefix) => sourcePath.startsWith(prefix)) &&
    // Next también publica fuentes internas bajo ".../app/...".
    existsSync(join(UI_ROOT, sourcePath))
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
    entry.url.includes("/_next/static/") && !entry.url.includes("node_modules"),
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
