// Aviso informativo de cookies: se muestra una vez por navegador. Si cambia
// lo que la app guarda (p. ej. una cookie nueva), subir la versión para que
// todos lo vuelvan a ver.
export const COOKIE_NOTICE_KEY = "hallazgos:aviso-cookies";
export const COOKIE_NOTICE_VERSION = "1";

export const hasSeenCookieNotice = (): boolean => {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === COOKIE_NOTICE_VERSION;
  } catch {
    // Sin almacenamiento (modo privado, datos bloqueados) se vuelve a mostrar
    // en cada carga; es preferible a no avisar.
    return false;
  }
};

export const markCookieNoticeSeen = () => {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, COOKIE_NOTICE_VERSION);
  } catch {
    // Se oculta igual en esta pestaña.
  }
};
