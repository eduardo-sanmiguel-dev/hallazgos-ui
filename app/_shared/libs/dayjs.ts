import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Permite dayjs(valor, "YYYY-MM-DD HH:mm"[, estricto]) como hacía moment.
dayjs.extend(customParseFormat);

/**
 * ISO o null si la fecha es inválida. moment devolvía null en ese caso y
 * dayjs lanza un error; se conserva el comportamiento anterior, incluido el
 * tipo (moment lo declaraba string).
 */
export const toISOStringOrNull = (date: Dayjs) =>
  (date.isValid() ? date.toISOString() : null) as string;

export default dayjs;
