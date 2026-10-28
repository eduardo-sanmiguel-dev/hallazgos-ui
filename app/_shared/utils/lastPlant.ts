// Planta que se propone al abrir un tablero (M5): la única que el usuario
// tiene asignada o, si tiene varias, la última que eligió en esa pantalla en
// este dispositivo (si todavía la tiene). Por usuario, porque hay equipos
// compartidos. Si el navegador no deja guardar (modo privado, datos
// bloqueados), simplemente no se recuerda.

export type PlantScreen = "dashboard" | "bi-epp";

const storageKey = (userId: number, screen: PlantScreen) =>
  `hallazgos:ultima-planta:${screen}:${userId}`;

export const readLastPlant = (userId: number, screen: PlantScreen) => {
  try {
    return localStorage.getItem(storageKey(userId, screen));
  } catch {
    return null;
  }
};

export const saveLastPlant = (
  userId: number,
  screen: PlantScreen,
  plantId: string,
) => {
  try {
    localStorage.setItem(storageKey(userId, screen), plantId);
  } catch {
    // Sin almacenamiento: no se recuerda.
  }
};

/** Id de la planta a proponer, o "" si no hay una clara. */
export const proposedPlantId = (
  plants: ReadonlyArray<{ id: number | string }>,
  userId: number,
  screen: PlantScreen,
) => {
  if (plants.length === 1) return String(plants[0].id);
  const last = userId ? readLastPlant(userId, screen) : null;
  return last && plants.some(({ id }) => String(id) === last) ? last : "";
};
