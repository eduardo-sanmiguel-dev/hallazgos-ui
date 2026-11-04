import { chromium, type FullConfig } from "@playwright/test";
import { mkdirSync } from "fs";
import { dirname } from "path";

import { e2eCredentials } from "./support/env";
import { expectLoggedIn, loginWithForm } from "./support/login";

/**
 * Inicia sesión una sola vez y guarda la cookie para todas las pruebas (el
 * login del API tiene límite de intentos por minuto).
 */
export default async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const { email, password } = e2eCredentials();

  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage({ baseURL });
    const response = await loginWithForm(page, email, password);
    if (!response.ok()) {
      throw new Error(
        `No se pudo iniciar sesión con el usuario E2E (HTTP ${response.status()}). ` +
          "Verifica e2e/.env.e2e y reinicia la API de desarrollo después de restaurar la base " +
          "para que vuelva a crear el usuario de pruebas. Ver e2e/README.md.",
      );
    }
    await expectLoggedIn(page);

    mkdirSync(dirname(storageState as string), { recursive: true });
    await page.context().storageState({ path: storageState as string });
  } finally {
    await browser.close();
  }
}
