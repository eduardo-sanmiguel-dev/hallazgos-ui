interface UserIdentity {
  id: number;
  name: string;
  email: string;
  role?: string;
  manufacturingPlants?: { id: number | string; name: string }[];
}

interface Store<T> {
  getState: () => T;
  subscribe: (listener: (state: T, previous: T) => void) => () => void;
}

/** Última planta elegida en los filtros, por usuario (plantSelection.store). */
interface PlantSelection {
  byUser: Record<number, string>;
}

// `type` (no interface): el SDK espera un objeto con índice de texto.
export type RumUser = {
  id: string;
  name: string;
  email: string;
  /** Rol en ComportArte: filtra sesiones por General, Supervisor o Administrador. */
  role: string;
  /** Plantas asignadas por nombre (filtra sesiones por planta o país). */
  plants: string;
};

interface RumIdentityClient {
  setUser: (user: RumUser) => void;
  clearUser: () => void;
  setGlobalContextProperty: (key: string, value: unknown) => void;
  removeGlobalContextProperty: (key: string) => void;
}

/** Contexto global de RUM con la planta elegida (columna context_selected_plant). */
export const SELECTED_PLANT_CONTEXT = "selected_plant";

const plantNames = (plants: UserIdentity["manufacturingPlants"] = []) =>
  plants
    .map(({ name }) => name)
    .sort((a, b) => a.localeCompare(b))
    .join(", ");

/** Separador del nombre en RUM: "Nombre · Rol · Planta". */
export const RUM_NAME_SEPARATOR = " · ";

/**
 * El nombre lleva rol y planta porque la lista de Sesiones de OpenObserve
 * tiene columnas fijas y solo muestra el nombre del usuario: así se ven ahí
 * sin abrir cada sesión. Los campos role y plants siguen aparte para filtrar.
 */
const toRumUser = (
  { id, name, email, role, manufacturingPlants }: UserIdentity,
  selectedPlant: string | null,
): RumUser => {
  const plants = plantNames(manufacturingPlants);
  return {
    id: String(id),
    name: [name, role, selectedPlant ?? plants].filter(Boolean).join(RUM_NAME_SEPARATOR),
    email,
    role: role ?? "",
    plants,
  };
};

const sameUser = (a: RumUser, b: RumUser) =>
  a.id === b.id &&
  a.name === b.name &&
  a.email === b.email &&
  a.role === b.role &&
  a.plants === b.plants;

/**
 * Identidad de la sesión de RUM: usuario con rol y plantas, y la planta que
 * eligió en los filtros. Así las sesiones, errores y frustraciones se pueden
 * filtrar por rol, planta o país. Se conserva al restaurar la sesión y se
 * actualiza cuando cambia el perfil o la planta elegida.
 */
export const syncRumUser = (
  store: Store<UserIdentity>,
  rum: RumIdentityClient,
  plantSelection?: Store<PlantSelection>,
  // Planta recordada en este dispositivo (lastPlant): el filtro la usa sin
  // pasar por plantSelection hasta que el usuario vuelve a elegir.
  readLastPlant: (userId: number) => string | null = () => null,
) => {
  // undefined: aún no se informó nada a RUM (al iniciar se limpia o identifica).
  let current: RumUser | null | undefined;
  let selectedPlant: string | null = null;

  /** Misma regla que SelectManufacturingPlantsOwn: sesión, recordada o la única. */
  const selectedPlantName = (user: UserIdentity) => {
    if (!plantSelection || !user.id) return null;
    const plants = user.manufacturingPlants ?? [];
    const plantId =
      plantSelection.getState().byUser[user.id] ??
      readLastPlant(user.id) ??
      (plants.length === 1 ? String(plants[0].id) : undefined);
    return (plantId && plants.find((plant) => String(plant.id) === String(plantId))?.name) || null;
  };

  const sync = () => {
    const state = store.getState();
    const plant = selectedPlantName(state);
    if (plant !== selectedPlant) {
      selectedPlant = plant;
      if (plant) rum.setGlobalContextProperty(SELECTED_PLANT_CONTEXT, plant);
      else rum.removeGlobalContextProperty(SELECTED_PLANT_CONTEXT);
    }
    if (!state.id) {
      if (current !== null) rum.clearUser();
      current = null;
      return;
    }
    const next = toRumUser(state, plant);
    if (current && sameUser(current, next)) return;
    current = next;
    rum.setUser(next);
  };

  sync();
  const unsubscribeUser = store.subscribe(sync);
  const unsubscribePlant = plantSelection?.subscribe(sync);
  return () => {
    unsubscribeUser();
    unsubscribePlant?.();
  };
};
