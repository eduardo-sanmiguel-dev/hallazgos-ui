import { expect, test } from "./support/fixtures";

// Escáneres que buscan Next.js vulnerables mandan `Next-Action` (Server
// Actions). La app no usa Server Actions: el middleware (proxy.ts) los corta
// con 400. Antes, con sesión, provocaban un 500 y un error en StatusPage.

test.describe("Peticiones de escáneres (Next-Action)", () => {
  test("se rechazan con 400, con y sin sesión", async ({ page, browser }) => {
    for (const path of ["/dashboard", "/hallazgos", "/"]) {
      const response = await page.request.post(path, {
        headers: { "Next-Action": "x" },
        data: "x",
      });
      expect(response.status(), `${path} con sesión`).toBe(400);
    }

    const anonymous = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const response = await anonymous.request.post("/", {
      headers: { "Next-Action": "x" },
      data: "x",
    });
    expect(response.status(), "/ sin sesión").toBe(400);
    await anonymous.close();
  });

  test("las páginas normales no se ven afectadas", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});
