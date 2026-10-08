// Nombres de archivos descargados: el back los define en Content-Disposition
// y, si no llega, el front arma uno de respaldo con la hora local del usuario.

/** Zona IANA del navegador (ej. America/Bogota), para mandarla al back. */
export const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/** "AAAA-MM-DD_HHmm_UTC±HH" en la hora local del navegador. */
export const buildLocalFileNameTimestamp = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetAbs = Math.abs(offsetMinutes);
  const offset = `UTC${offsetMinutes < 0 ? "-" : "+"}${pad(
    Math.floor(offsetAbs / 60),
  )}${offsetAbs % 60 ? pad(offsetAbs % 60) : ""}`;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}_${pad(date.getHours())}${pad(date.getMinutes())}_${offset}`;
};

export const getFileNameFromContentDisposition = (
  contentDisposition: string | undefined,
) => {
  if (!contentDisposition) return "";

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim());
    } catch {
      // Si viene mal codificado se usa filename=
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return plain ? plain[1].trim() : "";
};

/** Nombre del header si es válido para la extensión; si no, el de respaldo. */
export const resolveDownloadFileName = (
  contentDisposition: string | undefined,
  buildFallback: () => string,
  extension = ".xlsx",
) => {
  const fromHeader = getFileNameFromContentDisposition(contentDisposition);
  return fromHeader.toLowerCase().endsWith(extension)
    ? fromHeader
    : buildFallback();
};
