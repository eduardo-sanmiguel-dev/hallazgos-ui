import { expect, test } from "./support/fixtures";

// La API vive en otro dominio: el HTML pide abrir esa conexión (DNS, TCP y
// TLS) mientras se descarga el JavaScript, y no hasta la primera llamada.

test("el HTML abre de antemano la conexión con el dominio de la API", async ({ page }) => {
  const apiOrigins = new Set<string>();
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/v1/")) apiOrigins.add(url.origin);
  });

  await page.goto("/dashboard");
  await expect.poll(() => apiOrigins.size).toBeGreaterThan(0);

  const preconnect = page.locator('head link[rel="preconnect"]');
  await expect(preconnect).toHaveCount(1);
  // Sin crossorigin: la conexión con credenciales es la que usan las
  // llamadas (llevan cookies).
  await expect(preconnect).not.toHaveAttribute("crossorigin");
  const href = await preconnect.getAttribute("href");
  expect([...apiOrigins]).toEqual([new URL(href!).origin]);
});
