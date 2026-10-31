import { expect, test } from "@playwright/test";
import { createStore } from "zustand/vanilla";

import { syncRumUser } from "../../app/_shared/utils/rumUser";

import {
  isBotNavigator,
  isLocalHostname,
  shouldSendRumEvent,
} from "../../app/_shared/utils/rum";

test.describe("RUM: identidad del usuario", () => {
  test("restaura la identidad y actualiza nombre y correo con el mismo ID", () => {
    const store = createStore(() => ({
      id: 1,
      name: "Nombre anterior",
      email: "anterior@example.com",
      role: "usuario",
    }));
    const users: { id: string; name: string; email: string }[] = [];
    let clears = 0;
    const unsubscribe = syncRumUser(store, {
      setUser: (user) => users.push(user),
      clearUser: () => { clears++; },
    });

    expect(users).toEqual([
      { id: "1", name: "Nombre anterior", email: "anterior@example.com" },
    ]);
    store.setState({ name: "Nombre actualizado" });
    expect(users.at(-1)?.name).toBe("Nombre actualizado");
    store.setState({ email: "actual@example.com" });
    expect(users.at(-1)?.email).toBe("actual@example.com");
    store.setState({ role: "administrador" });
    expect(users).toHaveLength(3);
    store.setState({ id: 0, name: "", email: "" });
    expect(clears).toBe(1);
    unsubscribe();
    store.setState({ id: 2 });
    expect(users).toHaveLength(3);
  });

  test("identifica al usuario al iniciar sesión después de una visita anónima", () => {
    const store = createStore(() => ({ id: 0, name: "", email: "" }));
    const users: { id: string; name: string; email: string }[] = [];
    let clears = 0;
    const unsubscribe = syncRumUser(store, {
      setUser: (user) => users.push(user),
      clearUser: () => { clears++; },
    });
    expect(clears).toBe(1);
    expect(users).toHaveLength(0);
    store.setState({ id: 2, name: "Usuario", email: "user@example.com" });
    expect(users).toEqual([
      { id: "2", name: "Usuario", email: "user@example.com" },
    ]);
    unsubscribe();
  });
});

// Regla `beforeSend` del RUM (instrumentation-client.ts). Solo corre en
// producción, así que se prueba la función directamente, sin navegador.

test.describe("RUM: eventos que se envían", () => {
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
      expect(
        shouldSendRumEvent({ type: "action", action: { target: { name } } }),
      ).toBe(true);
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

test.describe("RUM: quién no se monitorea", () => {
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
    expect(isBotNavigator({ userAgent: CHROME_WINDOWS, webdriver: true })).toBe(
      true,
    );
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

test.describe("RUM: nada de máquinas locales", () => {
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
