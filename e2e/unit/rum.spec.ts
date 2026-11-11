import { describe, expect, test } from "vite-plus/test";
import { createStore } from "zustand/vanilla";

import { SELECTED_PLANT_CONTEXT, syncRumUser, type RumUser } from "../../app/_shared/utils/rumUser";

import { isBotNavigator, isLocalHostname, shouldSendRumEvent } from "../../app/_shared/utils/rum";

describe("RUM: identidad del usuario", () => {
  const PLANTS = [
    { id: 1, name: "Tepotzotlán" },
    { id: 3, name: "Bogotá" },
  ];
  /** Cliente de RUM simulado que registra cada llamada. */
  const fakeRum = () => {
    const calls = {
      users: [] as RumUser[],
      clears: 0,
      context: {} as Record<string, unknown>,
      contextChanges: 0,
    };
    return {
      calls,
      client: {
        setUser: (user: RumUser) => calls.users.push(user),
        clearUser: () => {
          calls.clears++;
        },
        setGlobalContextProperty: (key: string, value: unknown) => {
          calls.context[key] = value;
          calls.contextChanges++;
        },
        removeGlobalContextProperty: (key: string) => {
          delete calls.context[key];
          calls.contextChanges++;
        },
      },
    };
  };

  test("identifica con rol y plantas (por nombre) y actualiza al cambiar el perfil", () => {
    const store = createStore(() => ({
      id: 1,
      name: "Nombre anterior",
      email: "anterior@example.com",
      role: "Supervisor",
      manufacturingPlants: PLANTS,
    }));
    const { calls, client } = fakeRum();
    const unsubscribe = syncRumUser(store, client);

    expect(calls.users).toEqual([
      {
        id: "1",
        name: "Nombre anterior",
        email: "anterior@example.com",
        role: "Supervisor",
        plants: "Bogotá, Tepotzotlán",
      },
    ]);
    store.setState({ name: "Nombre actualizado" });
    expect(calls.users.at(-1)?.name).toBe("Nombre actualizado");
    store.setState({ email: "actual@example.com" });
    expect(calls.users.at(-1)?.email).toBe("actual@example.com");
    // El rol y las plantas ahora también son parte de la identidad.
    store.setState({ role: "Administrador" });
    expect(calls.users.at(-1)?.role).toBe("Administrador");
    store.setState({ manufacturingPlants: [PLANTS[0]] });
    expect(calls.users.at(-1)?.plants).toBe("Tepotzotlán");
    expect(calls.users).toHaveLength(5);
    // Un cambio ajeno a la identidad no vuelve a llamar a RUM.
    store.setState({ manufacturingPlants: [{ id: 1, name: "Tepotzotlán" }] });
    expect(calls.users).toHaveLength(5);

    store.setState({ id: 0, name: "", email: "" });
    expect(calls.clears).toBe(1);
    unsubscribe();
    store.setState({ id: 2 });
    expect(calls.users).toHaveLength(5);
  });

  test("identifica al usuario al iniciar sesión después de una visita anónima", () => {
    const store = createStore(() => ({ id: 0, name: "", email: "" }));
    const { calls, client } = fakeRum();
    const unsubscribe = syncRumUser(store, client);
    expect(calls.clears).toBe(1);
    expect(calls.users).toHaveLength(0);
    // Mientras sigue anónima no repite clearUser.
    store.setState({ name: "" });
    expect(calls.clears).toBe(1);
    store.setState({ id: 2, name: "Usuario", email: "user@example.com" });
    expect(calls.users).toEqual([
      { id: "2", name: "Usuario", email: "user@example.com", role: "", plants: "" },
    ]);
    unsubscribe();
  });

  test("sin elección en la sesión usa la planta recordada y, con una sola, esa", () => {
    const store = createStore(() => ({
      id: 7,
      name: "Admin",
      email: "admin@example.com",
      role: "Administrador",
      manufacturingPlants: PLANTS,
    }));
    const plants = createStore(() => ({ byUser: {} as Record<number, string> }));
    const remembered = fakeRum();
    syncRumUser(store, remembered.client, plants, (userId) => (userId === 7 ? "3" : null));
    expect(remembered.calls.context).toEqual({ [SELECTED_PLANT_CONTEXT]: "Bogotá" });
    // La elección de la sesión manda sobre la recordada.
    plants.setState({ byUser: { 7: "1" } });
    expect(remembered.calls.context).toEqual({ [SELECTED_PLANT_CONTEXT]: "Tepotzotlán" });

    const single = fakeRum();
    syncRumUser(
      createStore(() => ({
        id: 9,
        name: "S",
        email: "s@example.com",
        manufacturingPlants: [PLANTS[1]],
      })),
      single.client,
      createStore(() => ({ byUser: {} as Record<number, string> })),
    );
    expect(single.calls.context).toEqual({ [SELECTED_PLANT_CONTEXT]: "Bogotá" });
  });

  test("la planta elegida en los filtros va al contexto global y se actualiza", () => {
    const store = createStore(() => ({
      id: 7,
      name: "Admin",
      email: "admin@example.com",
      role: "Administrador",
      manufacturingPlants: PLANTS,
    }));
    const plants = createStore(() => ({ byUser: {} as Record<number, string> }));
    const { calls, client } = fakeRum();
    const unsubscribe = syncRumUser(store, client, plants);

    expect(calls.context).toEqual({});
    plants.setState({ byUser: { 7: "3" } });
    expect(calls.context).toEqual({ [SELECTED_PLANT_CONTEXT]: "Bogotá" });
    plants.setState({ byUser: { 7: "1" } });
    expect(calls.context).toEqual({ [SELECTED_PLANT_CONTEXT]: "Tepotzotlán" });
    // La misma planta no vuelve a escribir el contexto.
    const changes = calls.contextChanges;
    plants.setState({ byUser: { 7: "1", 8: "3" } });
    expect(calls.contextChanges).toBe(changes);
    // Al cerrar sesión se quita.
    store.setState({ id: 0, name: "", email: "" });
    expect(calls.context).toEqual({});
    unsubscribe();
    plants.setState({ byUser: { 7: "3" } });
    expect(calls.context).toEqual({});
  });
});

// Regla `beforeSend` del RUM (app/observability.ts). Solo corre en
// producción, así que se prueba la función directamente, sin navegador.

describe("RUM: eventos que se envían", () => {
  test("descarta los clics sobre el trazo de la firma", () => {
    expect(
      shouldSendRumEvent({
        type: "action",
        action: { target: { name: "firma-trazo" } },
      }),
    ).toBe(false);
  });

  test("envía las demás acciones, incluidos los botones de la firma", () => {
    for (const name of ["Guardar", "Limpiar", "Agregar", undefined]) {
      expect(shouldSendRumEvent({ type: "action", action: { target: { name } } })).toBe(true);
    }
    expect(shouldSendRumEvent({ type: "action", action: {} })).toBe(true);
  });

  test("envía los eventos que no son acciones", () => {
    for (const type of ["view", "error", "resource", "long_task"]) {
      expect(shouldSendRumEvent({ type })).toBe(true);
    }
  });
});

const CHROME_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const chromeBrands = (headless = false) => ({
  brands: [
    { brand: "Not_A Brand" },
    { brand: headless ? "HeadlessChrome" : "Google Chrome" },
    { brand: "Chromium" },
  ],
});

describe("RUM: quién no se monitorea", () => {
  test("bots que se declaran en el user agent", () => {
    for (const userAgent of [
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36",
    ]) {
      expect(isBotNavigator({ userAgent })).toBe(true);
    }
  });

  test("navegadores automatizados (webdriver)", () => {
    expect(isBotNavigator({ userAgent: CHROME_WINDOWS, webdriver: true })).toBe(true);
  });

  test("HeadlessChrome con el user agent disfrazado de Chrome", () => {
    // Visto en producción: OpenObserve lo reporta como HeadlessChrome, pero
    // navigator.userAgent dice Chrome y webdriver es false.
    expect(
      isBotNavigator({
        userAgent: CHROME_WINDOWS,
        webdriver: false,
        userAgentData: chromeBrands(true),
      }),
    ).toBe(true);
  });

  test("las personas sí se monitorean", () => {
    expect(
      isBotNavigator({
        userAgent: CHROME_WINDOWS,
        webdriver: false,
        userAgentData: chromeBrands(),
      }),
    ).toBe(false);
    for (const userAgent of [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    ]) {
      // Safari y Firefox no tienen userAgentData.
      expect(isBotNavigator({ userAgent })).toBe(false);
    }
  });
});

describe("RUM: nada de máquinas locales", () => {
  test("no se monitorea localhost, loopback ni IPs de red local", () => {
    for (const hostname of [
      "localhost",
      "app.localhost",
      "127.0.0.1",
      "0.0.0.0",
      "[::1]",
      "192.168.1.20",
      "10.0.0.5",
      "172.16.0.1",
      "172.31.255.255",
    ]) {
      expect(isLocalHostname(hostname), hostname).toBe(true);
    }
  });

  test("los dominios públicos sí", () => {
    for (const hostname of [
      "comportarte.com",
      "www.comportarte.com",
      "172.32.0.1",
      "82.197.95.145",
      "localhost.example.com",
    ]) {
      expect(isLocalHostname(hostname), hostname).toBe(false);
    }
  });
});
