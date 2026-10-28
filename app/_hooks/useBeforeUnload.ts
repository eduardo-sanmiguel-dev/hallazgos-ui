import { useEffect } from "react";

// Una salida a propósito que ya avisó por su cuenta (p. ej. "Tu sesión
// terminó" → login): no se pregunta otra vez.
let unloadAllowed = false;

/** La siguiente recarga o salida de la página no pregunta. */
export const allowUnload = () => {
  unloadAllowed = true;
};

// Aviso nativo del navegador al recargar o cerrar la pestaña con algo
// capturado. El texto lo pone el navegador; no se puede cambiar. La
// navegación dentro de la app (router.push) no lo dispara.
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unloadAllowed) return;
      event.preventDefault();
      // Safari y Chrome anteriores a la 119 lo piden además de preventDefault.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}
