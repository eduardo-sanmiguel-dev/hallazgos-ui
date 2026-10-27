// Aviso de "sesión terminada" (401 SESSION_EXPIRED). Lo emite el manejo de
// errores del API y lo escucha SessionEndedDialog, montado en el layout de
// las rutas con sesión. Con varias peticiones fallando a la vez se muestra un
// solo diálogo.
export const SESSION_ENDED_EVENT = "hallazgos:session-ended";

export const notifySessionEnded = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
};
