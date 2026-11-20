import { useDebounce } from "use-debounce";

/**
 * Espera tras el último cambio de un filtro antes de consultar. Elegir
 * varias opciones seguidas en un selector múltiple (zonas, clasificaciones,
 * estatus) o teclear una fecha hacía una consulta por cada paso; con la
 * espera se hace una al terminar. Los textos de las listas usan 500 ms
 * (usePaginatedList); aquí, selectores y fechas, algo menos.
 */
export const FILTER_DEBOUNCE_MS = 400;

const sameFilters = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Los filtros con los que consultar (`debounced`) y si todavía hay un cambio
 * esperando (`isPending`). Los controles muestran siempre los filtros
 * actuales; solo las consultas usan los de la espera. Un cambio que se
 * deshace dentro de la espera no consulta nada.
 */
export function useDebouncedFilters<T>(filters: T, delay = FILTER_DEBOUNCE_MS) {
  const [debounced] = useDebounce(filters, delay, { equalityFn: sameFilters });
  return { debounced, isPending: !sameFilters(debounced, filters) };
}
