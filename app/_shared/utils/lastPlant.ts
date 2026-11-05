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
