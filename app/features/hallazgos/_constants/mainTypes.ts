/**
 * Si la clasificación exige foto de evidencia (al crear y al cerrar). La
 * decide la bandera `requiresEvidence` del catálogo, la misma que valida el
 * API. Si la respuesta no la trae, se exige la foto.
 */
export const requiresPhotoEvidence = (mainType?: { requiresEvidence?: boolean | null } | null) =>
  mainType?.requiresEvidence !== false;

/** También protege catálogos en caché anteriores al filtro del API. */
export const activeSecondaryTypes = <T extends { id: number; isActive?: boolean }>(
  types: readonly T[],
): T[] => types.filter((type) => type.isActive !== false);
