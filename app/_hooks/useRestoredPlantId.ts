import { useUserSessionStore } from "@store";
import { usePlantSelectionStore } from "@store/plantSelection.store";
import { readLastPlant, restoredPlantId } from "@shared/utils/lastPlant";

/**
 * Planta con la que abren los filtros (la última elegida o la propuesta),
 * para el estado inicial de una lista. SelectManufacturingPlantsOwn la
 * aplicaba en un efecto después de montar, y la lista pedía su primera
 * página dos veces: sin planta y con ella.
 */
export function useRestoredPlantId() {
  const plants = useUserSessionStore((state) => state.manufacturingPlants);
  const userId = useUserSessionStore((state) => state.id);
  const remembered =
    usePlantSelectionStore((state) => state.byUser[userId]) ?? readLastPlant(userId);
  return restoredPlantId(plants, userId, remembered);
}
