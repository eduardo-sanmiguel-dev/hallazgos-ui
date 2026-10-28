// Última planta y último lugar con los que el usuario creó un hallazgo en este
// dispositivo (A5): el formulario los propone al abrir. Por usuario, porque
// hay celulares compartidos. Si el navegador no deja guardar (modo privado,
// datos bloqueados), simplemente no se recuerda.

export interface LastLocation {
  manufacturingPlantId: string;
  zoneId: string;
}

const storageKey = (userId: number) => `hallazgos:ultimo-lugar:${userId}`;

export const readLastLocation = (userId: number): LastLocation | null => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<LastLocation>;
    return typeof value.manufacturingPlantId === "string" &&
      typeof value.zoneId === "string"
      ? {
          manufacturingPlantId: value.manufacturingPlantId,
          zoneId: value.zoneId,
        }
      : null;
  } catch {
    return null;
  }
};

export const saveLastLocation = (userId: number, location: LastLocation) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(location));
  } catch {
    // Sin almacenamiento: no se recuerda.
  }
};
