// Ruta a la que regresar después de iniciar sesión (`/?next=...`), p. ej. el
// enlace "Ver hallazgo" de un correo abierto sin sesión. Sin dependencias: la
// usa también el proxy.

export const NEXT_PARAM = "next";

/**
 * Solo rutas internas ("/hallazgos?evidenceId=1"). Descarta URLs de otro
 * sitio ("https://...", "//sitio", "/\\sitio") para no redirigir fuera de la
 * app, y "/" (el login).
 */
export const safeNextPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value === "/") return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  // Lo que el navegador entendería como otro origen.
  try {
    const url = new URL(value, "http://app.local");
    if (url.origin !== "http://app.local") return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
};

/** "/" con la ruta de regreso, para el login. */
export const loginPathFor = (pathname: string, search: string) => {
  const next = safeNextPath(`${pathname}${search}`);
  return next ? `/?${NEXT_PARAM}=${encodeURIComponent(next)}` : "/";
};
