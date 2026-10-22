import { expect, test } from "@playwright/test";

import { getInstallMode } from "../../app/_shared/utils/installPrompt";

// Cuándo se ofrece "Instalar app" (lógica pura, sin navegador). El botón en
// el menú está en e2e/install-app.spec.ts.

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const CHROME_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

test.describe("Instalar app: cuándo se ofrece", () => {
  test("con el aviso del navegador usa el diálogo nativo", () => {
    expect(
      getInstallMode({
        hasPrompt: true,
        isStandalone: false,
        userAgent: CHROME_ANDROID,
      }),
    ).toBe("prompt");
  });

  test("ya instalada (abierta como app) no ofrece nada", () => {
    for (const userAgent of [CHROME_ANDROID, SAFARI_IPHONE]) {
      expect(
        getInstallMode({ hasPrompt: true, isStandalone: true, userAgent }),
      ).toBeNull();
    }
  });

  test("Safari de iPhone y de iPad explican los pasos", () => {
    expect(
      getInstallMode({
        hasPrompt: false,
        isStandalone: false,
        userAgent: SAFARI_IPHONE,
      }),
    ).toBe("ios");
    // iPadOS se presenta como Mac, pero tiene pantalla táctil.
    expect(
      getInstallMode({
        hasPrompt: false,
        isStandalone: false,
        userAgent: SAFARI_MAC,
        maxTouchPoints: 5,
      }),
    ).toBe("ios");
  });

  test("sin aviso del navegador ni iOS Safari no hay botón", () => {
    for (const [userAgent, maxTouchPoints] of [
      [CHROME_ANDROID, 5], // aún no instalable o ya rechazado
      [CHROME_IPHONE, 5], // en iOS solo Safari agrega a inicio
      [SAFARI_MAC, 0], // Safari de escritorio
    ] as const) {
      expect(
        getInstallMode({
          hasPrompt: false,
          isStandalone: false,
          userAgent,
          maxTouchPoints,
        }),
      ).toBeNull();
    }
  });
});
