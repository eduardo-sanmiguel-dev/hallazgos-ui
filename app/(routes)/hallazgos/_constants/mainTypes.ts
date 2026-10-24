/**
 * Clasificación que no exige foto: se reporta con descripción. Misma regla
 * que el API (isUnsafeBehaviorType en evidences.service.ts).
 */
export const isUnsafeBehaviorType = (mainTypeName = "") =>
  mainTypeName.toLocaleLowerCase().includes("comportamiento inseguro");
