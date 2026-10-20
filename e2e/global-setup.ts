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
  const page = await browser.newPage({ baseURL });

  await loginWithForm(page, email, password);
  await expectLoggedIn(page);

  mkdirSync(dirname(storageState as string), { recursive: true });
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}
