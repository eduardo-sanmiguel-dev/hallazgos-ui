import { CoverageReport } from "monocart-coverage-reports";

import { coverageOptions } from "./support/coverage";

/**
 * Pisos de coverage (unitarias + e2e) según lo alcanzado el 2026-11-18
 * (93 / 88 / 96 / 97 %): la cobertura no puede bajar. Van medio punto debajo
 * porque el coverage varía unas centésimas entre corridas (código que depende
 * de tiempos). Las ramas quedan por debajo de las demás métricas porque
 * incluyen casos que el navegador de pruebas no alcanza (cámara, arrastrar en
 * el calendario, fallos de IndexedDB).
 */
const THRESHOLDS = { statements: 92.5, branches: 87.5, functions: 95.5, lines: 96.5 };

/** Junta el coverage de todas las pruebas, genera el reporte y revisa los pisos. */
export default async function globalTeardown() {
  const results = await new CoverageReport(coverageOptions).generate();
  const summary = results?.summary as
    | Record<keyof typeof THRESHOLDS, { pct: number | string }>
    | undefined;
  if (!summary) return;

  const below = Object.entries(THRESHOLDS)
    .map(
      ([metric, minimum]) =>
        [metric, Number(summary[metric as keyof typeof THRESHOLDS]?.pct), minimum] as const,
    )
    .filter(([, pct, minimum]) => !(pct >= minimum));
  if (below.length) {
    throw new Error(
      `Coverage por debajo del piso: ${below
        .map(([metric, pct, minimum]) => `${metric} ${pct}% (mínimo ${minimum}%)`)
        .join(", ")}`,
    );
  }
}
