// Textos alternativos del plano de la planta (formulario de zonas y mapa de
// calor del dashboard). En el mapa de calor los datos de cada zona solo se
// ven en un tooltip al pasar el mouse: el texto alternativo los resume para
// quien usa lector de pantalla.

/** Cuántas zonas se nombran; el resto se cuenta. */
const MAX_NAMED = 5;

export const selectorPlanAlt = (hasPoint: boolean) =>
  hasPoint
    ? "Plano de la planta con la ubicación de la zona marcada"
    : "Plano de la planta, sin ubicación marcada para la zona";

const hallazgos = (count: number) => `${count} ${count === 1 ? "hallazgo" : "hallazgos"}`;

export const heatmapPlanAlt = (
  points: { areaName: string; statusCounts: { Abierto: number } }[],
) => {
  // Una zona puede tener varios puntos: se suman por nombre.
  const byArea = new Map<string, number>();
  for (const { areaName, statusCounts } of points) {
    if (statusCounts.Abierto > 0)
      byArea.set(areaName, (byArea.get(areaName) ?? 0) + statusCounts.Abierto);
  }
  if (!byArea.size) return "Plano de la planta: no hay hallazgos abiertos con ubicación";

  const sorted = [...byArea].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
  const named = sorted
    .slice(0, MAX_NAMED)
    .map(([name, count]) => `${name} (${hallazgos(count)})`)
    .join(", ");
  const rest = sorted.length - MAX_NAMED;
  const zones = `${sorted.length} ${sorted.length === 1 ? "zona" : "zonas"}`;
  return (
    `Mapa de calor de hallazgos abiertos sobre el plano de la planta, en ${zones}. ` +
    `${sorted.length === 1 ? "Zona" : "Con más hallazgos"}: ${named}` +
    (rest > 0 ? ` y ${rest} ${rest === 1 ? "zona más" : "zonas más"}.` : ".")
  );
};
