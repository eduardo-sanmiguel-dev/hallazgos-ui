// Aviso de "Sesión cerrada" que sobrevive a la recarga con la que se sale:
// se guarda antes de recargar y lo muestra la pantalla de inicio. Sin
// almacenamiento (modo privado estricto) simplemente no se muestra.
const KEY = "hada:logout-notice";

export const saveLogoutNotice = (message: string) => {
  try {
    sessionStorage.setItem(KEY, message);
  } catch {
    // Sin almacenamiento: se sale sin aviso.
  }
};

/** El aviso pendiente (una sola vez) o null. */
export const takeLogoutNotice = (): string | null => {
  try {
    const message = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
};
