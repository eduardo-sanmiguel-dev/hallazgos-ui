/**
 * Escapa texto para insertarlo en HTML armado a mano (ventanas de impresión,
 * tooltips HTML de Highcharts), como texto o como valor de un atributo entre
 * comillas. React ya escapa todo lo que se pinta con JSX: esto es solo para
 * los pocos lugares que arman HTML en un string, donde un nombre capturado
 * por un usuario (p. ej. `<img src=x onerror=…>`) se ejecutaría.
 */
export const escapeHtml = (value: string | number | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * URL externa para un `href`, solo si es http(s). Un enlace guardado sin
 * esquema ("maps.google.com/…") se abre como https; cualquier otro esquema
 * (`javascript:`, `data:`…) devuelve null y la pantalla lo muestra como texto.
 */
export const safeExternalUrl = (value: string | null | undefined): string | null => {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};
