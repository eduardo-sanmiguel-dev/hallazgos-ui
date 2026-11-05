import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { proposedPlantId, readLastPlant, saveLastPlant } from "../../app/_shared/utils/lastPlant";
import { usePlantSelectionStore } from "../../app/_store/plantSelection.store";

describe("Planta compartida por usuario", () => {
  const plants = [{ id: 1 }, { id: 2 }];
  let storage: Map<string, string>;

  beforeEach(() => {
    usePlantSelectionStore.setState({ byUser: {} });
    storage = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  test("recuerda la misma planta sin depender de una pantalla", () => {
    saveLastPlant(10, "2");
    expect(readLastPlant(10)).toBe("2");
    expect(proposedPlantId(plants, 10)).toBe("2");
  });

  test("aisla las preferencias de usuarios de un equipo compartido", () => {
    saveLastPlant(10, "2");
    saveLastPlant(20, "1");
    expect(proposedPlantId(plants, 10)).toBe("2");
    expect(proposedPlantId(plants, 20)).toBe("1");
    expect(proposedPlantId(plants, 30)).toBe("");
  });

  test("ignora una planta que ya no esta disponible", () => {
    saveLastPlant(10, "9");
    expect(proposedPlantId(plants, 10)).toBe("");
    expect(proposedPlantId([{ id: 1 }], 10)).toBe("1");
    expect(proposedPlantId([], 10)).toBe("");
  });

  test("propone la unica planta y permite limpiar la preferencia", () => {
    expect(proposedPlantId([{ id: "1" }], 10)).toBe("1");
    saveLastPlant(10, "2");
    saveLastPlant(10, "");
    expect(readLastPlant(10)).toBe("");
    expect(proposedPlantId(plants, 10)).toBe("");
  });

  test("no guarda una preferencia sin usuario", () => {
    saveLastPlant(0, "2");
    expect(storage.size).toBe(0);
    expect(readLastPlant(0)).toBeNull();
  });

  test("funciona si el navegador bloquea el almacenamiento", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => saveLastPlant(10, "2")).not.toThrow();
    expect(readLastPlant(10)).toBeNull();
    expect(proposedPlantId(plants, 10)).toBe("");
    expect(proposedPlantId([{ id: 1 }], 10)).toBe("1");
    usePlantSelectionStore.getState().select(10, "2");
    expect(usePlantSelectionStore.getState().byUser).toEqual({ 10: "2" });
  });
});
