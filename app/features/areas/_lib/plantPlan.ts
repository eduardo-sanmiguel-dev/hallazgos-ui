// Plano de la planta (formulario de zonas y mapa de calor del dashboard).
//
// Las coordenadas de las zonas se guardan en píxeles del PNG original
// (12396×17542). El archivo que se sirve es un WebP de 11577×16383 (WebP
// admite hasta 16383 px por lado) con la misma proporción, así que los
// cálculos usan este tamaño y no el del archivo: los puntos ya guardados
// caen en el mismo lugar.
export interface PlantPlan {
  src: string;
  width: number;
  height: number;
}

export const PLANT_PLAN: PlantPlan = {
  src: "/images/planos.webp",
  width: 12396,
  height: 17542,
};
