/**
 * Orden de las tablas, resuelto por la API (`orderBy` + `order`).
 *
 * Cada tabla declara sus columnas ordenables con un tipo de dato: el tipo
 * define la primera dirección al hacer clic y cómo se lee la dirección
 * ("A → Z", "Más reciente primero"…), para que el usuario entienda el orden
 * sin pensar en "ascendente" o "descendente".
 */

export type SortOrder = "asc" | "desc";

export type SortKind = "text" | "number" | "date" | "status" | "boolean";

export interface SortOption<K extends string = string> {
  /** Clave que entiende la API (lista blanca del listado). */
  key: K;
  /** Nombre visible, p. ej. "Fecha de creación". */
  label: string;
  kind: SortKind;
}

export interface SortState<K extends string = string> {
  orderBy: K;
  order: SortOrder;
}

const DIRECTION_LABELS: Record<SortKind, Record<SortOrder, string>> = {
  text: { asc: "A → Z", desc: "Z → A" },
  number: { asc: "Menor a mayor", desc: "Mayor a menor" },
  date: { asc: "Más antiguo primero", desc: "Más reciente primero" },
  // false < true en la BD: ascendente deja primero los inactivos.
  status: { asc: "Inactivos primero", desc: "Activos primero" },
  boolean: { asc: "No primero", desc: "Sí primero" },
};

/** Dirección legible según el tipo de dato. */
export const directionLabel = (kind: SortKind, order: SortOrder) => DIRECTION_LABELS[kind][order];

/**
 * Primera dirección al elegir una columna: la que se espera de cada dato
 * (textos de la A a la Z; fechas y números, lo más reciente o mayor primero;
 * estado, activos primero; sí/no, los "sí" primero).
 */
export const naturalOrder = (kind: SortKind): SortOrder => (kind === "text" ? "asc" : "desc");

export const findSortOption = <K extends string>(options: readonly SortOption<K>[], key: string) =>
  options.find((option) => option.key === key);

export const isSameSort = (a: SortState, b: SortState) =>
  a.orderBy === b.orderBy && a.order === b.order;

/**
 * Clic en el encabezado de una columna:
 * 1. Otra columna → esa columna en su dirección natural.
 * 2. Misma columna en su dirección natural → dirección contraria.
 * 3. Misma columna en la contraria → vuelve al orden predeterminado.
 * En la columna del orden predeterminado solo alterna las dos direcciones.
 */
export const nextHeaderSort = <K extends string>(
  current: SortState<K>,
  key: K,
  kind: SortKind,
  defaultSort: SortState<K>,
): SortState<K> => {
  const natural = naturalOrder(kind);
  if (current.orderBy !== key) return { orderBy: key, order: natural };
  const flipped: SortOrder = current.order === "asc" ? "desc" : "asc";
  if (current.order === natural || key === defaultSort.orderBy) {
    return { orderBy: key, order: flipped };
  }
  return defaultSort;
};

/** "Fecha de creación · Más reciente primero". */
export const sortSummary = <K extends string>(
  sort: SortState<K>,
  options: readonly SortOption<K>[],
) => {
  const option = findSortOption(options, sort.orderBy);
  if (!option) return "";
  return `${option.label} · ${directionLabel(option.kind, sort.order)}`;
};

/** Texto del botón de encabezado para lectores de pantalla y tooltip. */
export const headerSortHint = <K extends string>(
  option: SortOption<K>,
  current: SortState<K>,
  defaultSort: SortState<K>,
) => {
  const next = nextHeaderSort(current, option.key, option.kind, defaultSort);
  if (next.orderBy !== option.key) return "Restablecer el orden predeterminado";
  return `Ordenar por ${option.label}: ${directionLabel(option.kind, next.order)}`;
};

/** Clave de sessionStorage con el orden elegido en una tabla. */
export const sortStorageKey = (table: string) => `orden-tabla:${table}`;

/** Valor guardado → orden, o null si ya no es válido para la tabla. */
export const parseSavedSort = <K extends string>(
  saved: string | null,
  options: readonly SortOption<K>[],
): SortState<K> | null => {
  if (!saved) return null;
  try {
    const value = JSON.parse(saved) as Partial<SortState>;
    const option = findSortOption(options, String(value?.orderBy));
    if (!option || (value.order !== "asc" && value.order !== "desc")) return null;
    return { orderBy: option.key, order: value.order };
  } catch {
    return null;
  }
};

/** Parámetros para la API. */
export const sortParams = (sort?: SortState) =>
  sort ? { orderBy: sort.orderBy, order: sort.order } : {};

/** Contexto de la acción "orden_tabla" que se envía al RUM. */
export const sortActionContext = (table: string, previous: SortState, next: SortState) => ({
  tabla: table,
  columna: next.orderBy,
  direccion: next.order,
  anterior: `${previous.orderBy}:${previous.order}`,
});

/** Orden opcional que aceptan los servicios de listados paginados. */
export interface SortQuery {
  orderBy?: string;
  order?: SortOrder;
}

/** `orderBy`/`order` para los params de axios (nada si no hay orden). */
export const sortQueryParams = ({ orderBy, order }: SortQuery) =>
  orderBy ? { orderBy, ...(order && { order }) } : {};
