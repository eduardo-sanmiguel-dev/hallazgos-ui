import { describe, expect, it, vi } from "vite-plus/test";

import { SELECTED_PLANT_CONTEXT, syncRumUser } from "../../app/_shared/utils/rumUser";

type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  manufacturingPlants?: { id: number | string; name: string }[];
};

/** Store mínimo con la forma de zustand (getState + subscribe). */
const createStore = <T>(initial: T) => {
  let state = initial;
  const listeners = new Set<(state: T, previous: T) => void>();
  return {
    getState: () => state,
    subscribe: (listener: (state: T, previous: T) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: (next: T) => {
      const previous = state;
      state = next;
      listeners.forEach((listener) => listener(state, previous));
    },
    listeners,
  };
};

const createRum = () => ({
  setUser: vi.fn(),
  clearUser: vi.fn(),
  setGlobalContextProperty: vi.fn(),
  removeGlobalContextProperty: vi.fn(),
});

const ana: User = {
  id: 7,
  name: "Ana",
  email: "ana@hallazgos.test",
  role: "Supervisor",
  manufacturingPlants: [
    { id: 2, name: "Tepotzotlán" },
    { id: 1, name: "Manizales" },
  ],
};
const noSession: User = { id: 0, name: "", email: "" };

describe("syncRumUser", () => {
  it("identifica al usuario con rol y plantas ordenadas en el nombre", () => {
    const rum = createRum();

    syncRumUser(createStore(ana), rum);

    expect(rum.setUser).toHaveBeenCalledWith({
      id: "7",
      name: "Ana · Supervisor · Manizales, Tepotzotlán",
      email: "ana@hallazgos.test",
      role: "Supervisor",
      plants: "Manizales, Tepotzotlán",
    });
  });

  it("sin rol ni plantas deja esos campos vacíos", () => {
    const rum = createRum();

    syncRumUser(createStore<User>({ id: 3, name: "Beto", email: "b@x.test" }), rum);

    expect(rum.setUser).toHaveBeenCalledWith({
      id: "3",
      name: "Beto",
      email: "b@x.test",
      role: "",
      plants: "",
    });
  });

  it("sin sesión limpia el usuario una sola vez", () => {
    const rum = createRum();
    const store = createStore(noSession);

    syncRumUser(store, rum);
    store.set({ ...noSession });

    expect(rum.clearUser).toHaveBeenCalledTimes(1);
    expect(rum.setUser).not.toHaveBeenCalled();
  });

  it("no vuelve a enviar el mismo usuario; sí cuando cambia el perfil", () => {
    const rum = createRum();
    const store = createStore(ana);

    syncRumUser(store, rum);
    store.set({ ...ana });
    store.set({ ...ana, name: "Ana María" });
    store.set(noSession);

    expect(rum.setUser).toHaveBeenCalledTimes(2);
    expect(rum.setUser).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "Ana María · Supervisor · Manizales, Tepotzotlán" }),
    );
    expect(rum.clearUser).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["id", { id: 8 }],
    ["correo", { email: "otra@x.test" }],
    ["rol", { role: "General" }],
    ["plantas", { manufacturingPlants: [{ id: 1, name: "Manizales" }] }],
  ])("un cambio de %s vuelve a identificar al usuario", (_c, change) => {
    const rum = createRum();
    const store = createStore(ana);

    syncRumUser(store, rum);
    store.set({ ...ana, ...change });

    expect(rum.setUser).toHaveBeenCalledTimes(2);
  });

  describe("planta elegida", () => {
    it("usa la de los filtros, la recordada o la única, y la publica en el contexto", () => {
      const rum = createRum();
      const store = createStore(ana);
      const selection = createStore<{ byUser: Record<number, string> }>({ byUser: {} });
      const lastPlant = vi.fn<(userId: number) => string | null>().mockReturnValue("1");

      const stop = syncRumUser(store, rum, selection, lastPlant);

      expect(lastPlant).toHaveBeenCalledWith(7);
      expect(rum.setGlobalContextProperty).toHaveBeenCalledWith(
        SELECTED_PLANT_CONTEXT,
        "Manizales",
      );
      expect(rum.setUser).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "Ana · Supervisor · Manizales" }),
      );

      selection.set({ byUser: { 7: "2" } });
      expect(rum.setGlobalContextProperty).toHaveBeenLastCalledWith(
        SELECTED_PLANT_CONTEXT,
        "Tepotzotlán",
      );

      // Una planta que el usuario ya no tiene: sin planta elegida.
      selection.set({ byUser: { 7: "99" } });
      expect(rum.removeGlobalContextProperty).toHaveBeenCalledWith(SELECTED_PLANT_CONTEXT);

      stop();
      expect(store.listeners.size).toBe(0);
      expect(selection.listeners.size).toBe(0);
    });

    it("con una sola planta la toma aunque no se haya elegido", () => {
      const rum = createRum();
      const single = { ...ana, manufacturingPlants: [{ id: 5, name: "Única" }] };

      syncRumUser(createStore(single), rum, createStore({ byUser: {} }));

      expect(rum.setGlobalContextProperty).toHaveBeenCalledWith(SELECTED_PLANT_CONTEXT, "Única");
    });

    it("sin plantas ni elección no publica planta; sin sesión tampoco la busca", () => {
      const rum = createRum();
      const store = createStore<User>({ ...ana, manufacturingPlants: undefined });

      syncRumUser(store, rum, createStore({ byUser: {} }));
      store.set(noSession);

      expect(rum.setGlobalContextProperty).not.toHaveBeenCalled();
      expect(rum.removeGlobalContextProperty).not.toHaveBeenCalled();
    });

    it("sin selección de plantas (sin store) desuscribe solo al usuario", () => {
      const store = createStore(ana);

      const stop = syncRumUser(store, createRum());
      stop();

      expect(store.listeners.size).toBe(0);
    });
  });
});
