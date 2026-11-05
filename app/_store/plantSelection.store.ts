import { create } from "zustand";
import { saveLastPlant } from "@shared/utils/lastPlant";

interface PlantSelection {
  byUser: Record<number, string>;
  select: (userId: number, plantId: string) => void;
}

// Sincroniza selectores montados (por ejemplo, la lista y el dialogo de EPP).
export const usePlantSelectionStore = create<PlantSelection>((set) => ({
  byUser: {},
  select: (userId, plantId) => {
    if (!userId) return;
    saveLastPlant(userId, plantId);
    set((state) => ({ byUser: { ...state.byUser, [userId]: plantId } }));
  },
}));
