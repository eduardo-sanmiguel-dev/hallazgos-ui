// Preferencia compartida por las pantallas, aislada por usuario y dispositivo.
const storageKey = (userId: number) => `hallazgos:ultima-planta:${userId}`;

export const readLastPlant = (userId: number): string | null => {
  if (!userId) return null;
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
};

export const saveLastPlant = (userId: number, plantId: string) => {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), plantId);
  } catch {
    // La seleccion en memoria sigue funcionando sin almacenamiento local.
  }
};

export const proposedPlantId = (plants: ReadonlyArray<{ id: number | string }>, userId: number) => {
  const last = readLastPlant(userId);
  if (last && plants.some(({ id }) => String(id) === last)) return last;
  return plants.length === 1 ? String(plants[0].id) : "";
};

/**
 * Planta con la que abre un filtro: la última elegida (vacía si el usuario
 * la quitó a propósito) o, si ya no tiene acceso a ella, la propuesta. La
 * aplica SelectManufacturingPlantsOwn al montar; una pantalla que arranca
 * con ella ya puesta evita pedir su lista primero sin planta.
 */
export const restoredPlantId = (
  plants: ReadonlyArray<{ id: number | string }>,
  userId: number,
  remembered: string | null | undefined,
  defaultToFirst = false,
) =>
  remembered === ""
    ? ""
    : remembered && plants.some(({ id }) => String(id) === remembered)
      ? remembered
      : proposedPlantId(plants, userId) ||
        (defaultToFirst && plants.length ? String(plants[0].id) : "");
