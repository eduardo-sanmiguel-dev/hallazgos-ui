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

const toRumUser = ({ id, name, email, role, manufacturingPlants }: UserIdentity): RumUser => ({
  id: String(id),
  name,
  email,
  role: role ?? "",
  plants: plantNames(manufacturingPlants),
});

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

  const identify = (state: UserIdentity) => {
    if (!state.id) {
      if (current !== null) rum.clearUser();
      current = null;
      return;
    }
    const next = toRumUser(state);
    if (current && sameUser(current, next)) return;
    current = next;
    rum.setUser(next);
  };

  const syncSelectedPlant = () => {
    const user = store.getState();
    const plants = user.manufacturingPlants ?? [];
    // Misma regla que SelectManufacturingPlantsOwn: elección de la sesión,
    // luego la recordada y, con una sola planta, esa.
    const plantId = user.id
      ? (plantSelection?.getState().byUser[user.id] ??
        readLastPlant(user.id) ??
        (plants.length === 1 ? String(plants[0].id) : undefined))
      : undefined;
    const name = plantId
      ? plants.find((plant) => String(plant.id) === String(plantId))?.name
      : undefined;
    const value = name ?? null;
    if (value === selectedPlant) return;
    selectedPlant = value;
    if (value) rum.setGlobalContextProperty(SELECTED_PLANT_CONTEXT, value);
    else rum.removeGlobalContextProperty(SELECTED_PLANT_CONTEXT);
  };

  identify(store.getState());
  if (plantSelection) syncSelectedPlant();

  const unsubscribeUser = store.subscribe((state) => {
    identify(state);
    if (plantSelection) syncSelectedPlant();
  });
  const unsubscribePlant = plantSelection?.subscribe(syncSelectedPlant);
  return () => {
    unsubscribeUser();
    unsubscribePlant?.();
  };
};
