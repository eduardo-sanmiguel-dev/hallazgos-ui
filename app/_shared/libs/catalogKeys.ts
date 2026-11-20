import { getQueryClient } from "./queryClient";

/**
 * Filtros como llegan a la URL: los servicios omiten los vacíos (`""`,
 * `null`, `undefined`, `[]`), así que la llave también. Sin esto, `{}` y
 * `{ manufacturingPlantId: "" }` eran dos entradas de caché para la misma
 * petición y se pedía dos veces (p. ej. /areas en Zonas y en su formulario).
 */
export const catalogParams = (filters: object = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );

/**
 * Query keys de los catálogos (datos que se reutilizan en selects y filtros).
 * Todas cuelgan de ["catalogs", nombre, ...filtros] para poder invalidar un
 * catálogo completo, con cualquier filtro, por su prefijo.
 */
export const catalogKeys = {
  all: ["catalogs"] as const,
  mainTypes: () => ["catalogs", "mainTypes"] as const,
  zones: (filters: object = {}) => ["catalogs", "zones", catalogParams(filters)] as const,
  processes: (filters: object = {}) => ["catalogs", "processes", catalogParams(filters)] as const,
  manufacturingPlants: () => ["catalogs", "manufacturingPlants"] as const,
  areas: (filters: object = {}) => ["catalogs", "areas", catalogParams(filters)] as const,
  employeeCatalogs: () => ["catalogs", "employeeCatalogs"] as const,
  gembaWalkZones: (filters: object = {}) =>
    ["catalogs", "gembaWalkZones", catalogParams(filters)] as const,
  icsCatalogs: () => ["catalogs", "icsCatalogs"] as const,
  typesOfEvents: () => ["catalogs", "typesOfEvents"] as const,
  users: (filters: object = {}) => ["catalogs", "users", catalogParams(filters)] as const,
  employees: (filters: object = {}) => ["catalogs", "employees", catalogParams(filters)] as const,
};

export type CatalogName = Exclude<keyof typeof catalogKeys, "all">;

/**
 * Marca catálogos como desactualizados tras crear/editar/eliminar: los que
 * están en pantalla se vuelven a pedir y el resto al usarse.
 */
export const invalidateCatalogs = (...names: CatalogName[]) => {
  const queryClient = getQueryClient();

  return Promise.all(
    names.map((name) => queryClient.invalidateQueries({ queryKey: ["catalogs", name] })),
  );
};

/** Ejecuta la mutación y, si sale bien, invalida los catálogos indicados. */
export const withCatalogInvalidation =
  <Args extends unknown[], Result>(
    mutation: (...args: Args) => Promise<Result>,
    ...names: CatalogName[]
  ) =>
  async (...args: Args): Promise<Result> => {
    const result = await mutation(...args);
    void invalidateCatalogs(...names);
    return result;
  };
