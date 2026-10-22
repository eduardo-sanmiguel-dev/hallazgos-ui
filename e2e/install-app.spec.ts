import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";
import { toast, trackPageErrors } from "./support/ui";

// "Instalar app" en el menú de usuario. El aviso del navegador
// (beforeinstallprompt) se simula: Chrome solo lo dispara con interacción real.

const openUserMenu = async (page: Page) => {
  await page.getByRole("button", { name: /^Cuenta de / }).click();
  return page.getByRole("menu");
};

/** Dispara un beforeinstallprompt falso; `outcome` es lo que "elige" el usuario. */
const firePrompt = (page: Page, outcome: "accepted" | "dismissed") =>
  page.evaluate((outcome) => {
    const w = window as unknown as { __promptCalls: number };
    w.__promptCalls = 0;
    const event = Object.assign(new Event("beforeinstallprompt"), {
      prompt: async () => {
        w.__promptCalls++;
      },
      userChoice: Promise.resolve({ outcome }),
    });
    window.dispatchEvent(event);
  }, outcome);

const promptCalls = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __promptCalls: number }).__promptCalls,
  );

test.describe("Instalar app", () => {
  test("solo aparece cuando el navegador permite instalar y abre su diálogo", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard");

    // Sin aviso del navegador no hay opción.
    let menu = await openUserMenu(page);
    await expect(
      menu.getByRole("menuitem", { name: "Cerrar sesión" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Instalar app" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    await firePrompt(page, "accepted");
    menu = await openUserMenu(page);
    await menu.getByRole("menuitem", { name: "Instalar app" }).click();
    await expect(toast(page, "App instalada")).toBeVisible();
    expect(await promptCalls(page)).toBe(1);

    // Ya instalada: la opción desaparece.
    menu = await openUserMenu(page);
    await expect(
      menu.getByRole("menuitem", { name: "Cerrar sesión" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("menuitem", { name: "Instalar app" }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("si el usuario cancela, no se avisa como instalada", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await firePrompt(page, "dismissed");
    const menu = await openUserMenu(page);
    await menu.getByRole("menuitem", { name: "Instalar app" }).click();
    await expect.poll(() => promptCalls(page)).toBe(1);
    await expect(toast(page, "App instalada")).toHaveCount(0);
  });
});

test.describe("Instalar app en iPhone", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("explica cómo agregarla a inicio desde Safari", async ({ page }) => {
    await page.goto("/dashboard");
    const menu = await openUserMenu(page);
    await menu.getByRole("menuitem", { name: "Instalar app" }).click();

    const dialog = page.getByRole("dialog", { name: "Instalar app" });
    await expect(dialog).toContainText("Compartir");
    await expect(dialog).toContainText("Agregar a inicio");
    await dialog.getByRole("button", { name: "Entendido" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
