import { useQuery } from "@tanstack/react-query";

import {
  AreasService,
  EmployeesService,
  GembaWalkZonesService,
  IcsService,
  MainTypesService,
  ManufacturingPlantsService,
  ProcessesService,
  TypesOfEventsService,
  ZonesService,
} from "@services";
import { catalogKeys } from "@shared/libs/catalogKeys";

// Los catálogos cambian poco: se consideran frescos 5 min y se comparten
// entre todas las pantallas (una sola petición por catálogo/filtro).
const CATALOG_STALE_TIME = 5 * 60 * 1000;

type ZonesFilters = Parameters<typeof ZonesService.findAll>[0];
type ProcessesFilters = Parameters<typeof ProcessesService.findAll>[0];
type AreasFilters = Parameters<typeof AreasService.findAll>[0];
type GembaWalkZonesFilters = Parameters<
  typeof GembaWalkZonesService.findAll
>[0];

/**
 * Arreglo vacío estable para `data ?? EMPTY_CATALOG`: un `[]` nuevo en cada
 * render dispararía los useEffect/useMemo que dependen del catálogo.
 */
export const EMPTY_CATALOG: never[] = [];

interface CatalogOptions {
  // false: no se pide (p. ej. hasta que se elija una planta).
  enabled?: boolean;
}

/**
 * Catálogo genérico (listas de solo lectura sin CRUD propio en la UI, p. ej.
 * los de CIAEL). Se cachea por nombre + parámetros como los demás.
 */
export const useCatalog = <T>(
  name: string,
  queryFn: () => Promise<T>,
  { enabled = true, params = {} }: CatalogOptions & { params?: object } = {},
) =>
  useQuery({
    queryKey: ["catalogs", name, params],
    // Sin argumentos: React Query pasa su contexto y algunos findAll aceptan
    // filtros como primer parámetro.
    queryFn: () => queryFn(),
    staleTime: CATALOG_STALE_TIME,
    enabled,
  });

export const useMainTypes = () =>
  useQuery({
    queryKey: catalogKeys.mainTypes(),
    queryFn: () => MainTypesService.findAll({}),
    staleTime: CATALOG_STALE_TIME,
  });

export const useZones = (
  filters: ZonesFilters = {},
  { enabled = true }: CatalogOptions = {},
) =>
  useQuery({
    queryKey: catalogKeys.zones(filters),
    queryFn: () => ZonesService.findAll(filters),
    staleTime: CATALOG_STALE_TIME,
    enabled,
  });

export const useProcesses = (
  filters: ProcessesFilters = {},
  { enabled = true }: CatalogOptions = {},
) =>
  useQuery({
    queryKey: catalogKeys.processes(filters),
    queryFn: () => ProcessesService.findAll(filters),
    staleTime: CATALOG_STALE_TIME,
    enabled,
  });

export const useManufacturingPlants = () =>
  useQuery({
    queryKey: catalogKeys.manufacturingPlants(),
    queryFn: () => ManufacturingPlantsService.findAll({}),
    staleTime: CATALOG_STALE_TIME,
  });

export const useAreas = (
  filters: AreasFilters = {},
  { enabled = true }: CatalogOptions = {},
) =>
  useQuery({
    queryKey: catalogKeys.areas(filters),
    queryFn: () => AreasService.findAll(filters),
    staleTime: CATALOG_STALE_TIME,
    enabled,
  });

/** Áreas, puestos, géneros y plantas de colaboradores. */
export const useEmployeeCatalogs = () =>
  useQuery({
    queryKey: catalogKeys.employeeCatalogs(),
    queryFn: () => EmployeesService.catalogs(),
    staleTime: CATALOG_STALE_TIME,
  });

export const useGembaWalkZones = (
  filters: GembaWalkZonesFilters = {},
  { enabled = true }: CatalogOptions = {},
) =>
  useQuery({
    queryKey: catalogKeys.gembaWalkZones(filters),
    queryFn: () => GembaWalkZonesService.findAll(filters),
    staleTime: CATALOG_STALE_TIME,
    enabled,
  });

/** Reglas de vida con sus estándares y áreas de comportamiento (ICS). */
export const useIcsCatalogs = () =>
  useQuery({
    queryKey: catalogKeys.icsCatalogs(),
    queryFn: () => IcsService.catalogs(),
    staleTime: CATALOG_STALE_TIME,
  });

export const useTypesOfEvents = () =>
  useQuery({
    queryKey: catalogKeys.typesOfEvents(),
    queryFn: () => TypesOfEventsService.findAll(),
    staleTime: CATALOG_STALE_TIME,
  });
