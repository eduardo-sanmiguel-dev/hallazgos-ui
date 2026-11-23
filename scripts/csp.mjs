// Política de seguridad de contenido (CSP) de la UI: la defensa de fondo
// contra XSS. Aunque algún texto llegara a insertarse como HTML, el navegador
// no ejecuta scripts que no sean los archivos de la app (ni en línea, ni
// `javascript:`, ni atributos `onerror=`), y la página no se puede incrustar
// en otro sitio.
//
// La arma el build con los orígenes de cada ambiente (vite.config.ts) y la
// deja en dist/security-headers.json; scripts/serve.mjs la envía como
// cabecera. Si se agrega un servicio externo (otra API, otro dominio de
// imágenes), hay que agregarlo aquí o el navegador lo bloqueará.

export const SECURITY_HEADERS_FILE = "security-headers.json";

const originOf = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
};

/** El mismo origen con ws(s): el WebSocket de versiones va a la API. */
const socketOriginOf = (origin) => origin && origin.replace(/^http/, "ws");

/**
 * @param {{ apiUrl?: string, apiOrigin?: string, openObserveSite?: string }} env
 */
export const buildCsp = ({ apiUrl, apiOrigin, openObserveSite } = {}) => {
  const apis = [...new Set([originOf(apiUrl), originOf(apiOrigin)].filter(Boolean))];
  // El RUM de OpenObserve: VITE_OPENOBSERVE_SITE es el host (sin esquema).
  const observe = openObserveSite ? originOf(`https://${openObserveSite}`) : null;

  const directives = {
    "default-src": ["'self'"],
    // Solo los archivos de la app: nada en línea ni de terceros.
    "script-src": ["'self'"],
    // MUI (emotion) y Highcharts escriben estilos en línea.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Fotos de evidencias y archivos de la API; QR, firmas y vistas previas
    // como data:/blob:.
    "img-src": ["'self'", "data:", "blob:", ...apis],
    "font-src": ["'self'", "data:"],
    // data:/blob: son datos locales (la foto de la cámara se convierte con
    // fetch); no abren conexiones a otros sitios.
    "connect-src": [
      "'self'",
      "data:",
      "blob:",
      ...apis,
      ...apis.map(socketOriginOf),
      ...(observe ? [observe] : []),
    ],
    // Compresión de fotos, confeti y la grabación de sesiones usan workers
    // creados desde blob:.
    "worker-src": ["'self'", "blob:"],
    "media-src": ["'self'", "blob:", "data:"],
    "frame-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
};

/** Cabeceras de seguridad de los documentos de la UI. */
export const securityHeaders = (env) => ({
  "Content-Security-Policy": buildCsp(env),
  // Navegadores anteriores a frame-ancestors.
  "X-Frame-Options": "DENY",
});
