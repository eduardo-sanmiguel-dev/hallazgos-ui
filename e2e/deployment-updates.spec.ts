import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import ts from "typescript";

// Se prueba el cliente real en Chrome, sin API, BD ni credenciales.
const source = ts
  .transpileModule(
    readFileSync(join(process.cwd(), "app/_services/deploymentUpdates.ts"), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
  )
  .outputText.replace(
    "export function connectDeploymentUpdates",
    "window.connectDeploymentUpdates = function",
  );

test("recarga una sola vez con una versión distinta e ignora mensajes inválidos", async ({
  page,
}) => {
  let send: (message: string) => void = () => {};
  await page.routeWebSocket("wss://api.example/deployments/ws", (socket) => {
    send = (message) => socket.send(message);
  });
  await page.goto("about:blank");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const state = window as unknown as {
      updates: number;
      connectDeploymentUpdates: (
        url: string,
        version: string,
        callback: () => boolean,
      ) => () => void;
    };
    state.updates = 0;
    state.connectDeploymentUpdates("wss://api.example/deployments/ws", "build-A", () => {
      state.updates++;
      return true;
    });
  });
  await expect.poll(() => page.evaluate(() => document.readyState)).toBe("complete");
  send("invalid JSON");
  send(JSON.stringify({ type: "ui-version", version: "build-A" }));
  send(JSON.stringify({ type: "other", version: "build-B" }));
  send(JSON.stringify({ type: "ui-version", version: null }));
  send(JSON.stringify({ type: "ui-version", version: "" }));
  expect(await page.evaluate(() => (window as unknown as { updates: number }).updates)).toBe(0);
  send(JSON.stringify({ type: "ui-version", version: "build-B" }));
  send(JSON.stringify({ type: "ui-version", version: "build-B" }));
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { updates: number }).updates))
    .toBe(1);
});

test("reconecta tras una caída y recibe la versión que se perdió", async ({ page }) => {
  let connections = 0;
  await page.routeWebSocket("wss://api.example/deployments/ws", (socket) => {
    connections++;
    if (connections === 1) socket.close();
    else socket.send(JSON.stringify({ type: "ui-version", version: "build-B" }));
  });
  await page.goto("about:blank");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const state = window as unknown as {
      updates: number;
      connectDeploymentUpdates: (
        url: string,
        version: string,
        callback: () => boolean,
      ) => () => void;
    };
    state.updates = 0;
    state.connectDeploymentUpdates("wss://api.example/deployments/ws", "build-A", () => {
      state.updates++;
      return true;
    });
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { updates: number }).updates))
    .toBe(1);
  expect(connections).toBeGreaterThanOrEqual(2);
});

test("un aviso de la versión anterior no bloquea el siguiente deploy", async ({ page }) => {
  let send: (message: string) => void = () => {};
  await page.routeWebSocket("wss://api.example/deployments/ws", (socket) => {
    send = (message) => socket.send(message);
  });
  await page.goto("about:blank");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const state = window as unknown as {
      updates: string[];
      connectDeploymentUpdates: (
        url: string,
        version: string,
        callback: (version: string) => Promise<boolean>,
      ) => () => void;
    };
    state.updates = [];
    state.connectDeploymentUpdates(
      "wss://api.example/deployments/ws",
      "build-B",
      async (version) => {
        state.updates.push(version);
        return version === "build-C";
      },
    );
  });
  send(JSON.stringify({ type: "ui-version", version: "build-A" }));
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { updates: string[] }).updates))
    .toEqual(["build-A"]);
  send(JSON.stringify({ type: "ui-version", version: "build-C" }));
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { updates: string[] }).updates))
    .toEqual(["build-A", "build-C"]);
});

type DeploymentWindow = Window & {
  updates: Array<{ version: string; target: string; stored: string | null }>;
  disconnectUpdates: () => void;
  acceptUpdate: boolean;
  connectDeploymentUpdates: (
    url: string,
    version: string,
    callback: (version: string, target: string) => boolean,
  ) => () => void;
};
const socketUrl = "wss://api.example/deployments/ws";
const apiKey = `deployment-api-version:${socketUrl}`;

async function openApiClient(
  page: import("@playwright/test").Page,
  { navigate = true, accept = true } = {},
) {
  if (navigate) {
    await page.route("http://app.example/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<html><body>App</body></html>" }),
    );
    await page.goto("http://app.example/");
  }
  await page.addScriptTag({ content: source });
  await page.evaluate(
    ({ socketUrl, apiKey, accept }) => {
      const state = window as unknown as DeploymentWindow;
      state.updates = [];
      state.acceptUpdate = accept;
      state.disconnectUpdates = state.connectDeploymentUpdates(
        socketUrl,
        "ui-A",
        (version, target) => {
          state.updates.push({ version, target, stored: sessionStorage.getItem(apiKey) });
          return state.acceptUpdate;
        },
      );
    },
    { socketUrl, apiKey, accept },
  );
}

test("la primera versión de API establece la referencia sin recargar", async ({ page }) => {
  await page.routeWebSocket(socketUrl, (socket) =>
    socket.send(JSON.stringify({ type: "api-version", version: "api-A" })),
  );
  await openApiClient(page);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), apiKey))
    .toBe("api-A");
  expect(await page.evaluate(() => (window as unknown as DeploymentWindow).updates)).toEqual([]);
});

test("un deploy exclusivo de API recarga una vez y persiste el ID antes de recargar", async ({
  page,
}) => {
  let send: (version: string) => void = () => {};
  let apiVersion = "api-A";
  await page.routeWebSocket(socketUrl, (socket) => {
    send = (version) => {
      apiVersion = version;
      socket.send(JSON.stringify({ type: "api-version", version }));
    };
    send(apiVersion);
  });
  await openApiClient(page);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), apiKey))
    .toBe("api-A");
  send("api-B");
  send("api-B");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DeploymentWindow).updates))
    .toEqual([{ version: "api-B", target: "api", stored: "api-B" }]);
  // Simular la recarga real: el documento nuevo conserva sessionStorage.
  await page.reload();
  await openApiClient(page, { navigate: false });
  expect(await page.evaluate((key) => sessionStorage.getItem(key), apiKey)).toBe("api-B");
  expect(await page.evaluate(() => (window as unknown as DeploymentWindow).updates)).toEqual([]);
});

test("tras recargar, la misma versión de API no vuelve a provocar una recarga", async ({
  page,
}) => {
  await page.routeWebSocket(socketUrl, (socket) =>
    socket.send(JSON.stringify({ type: "api-version", version: "api-B" })),
  );
  await page.route("http://app.example/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("http://app.example/");
  await page.evaluate(({ key }) => sessionStorage.setItem(key, "api-B"), { key: apiKey });
  await openApiClient(page, { navigate: false });
  await page.reload();
  await openApiClient(page, { navigate: false });
  expect(await page.evaluate(() => (window as unknown as DeploymentWindow).updates)).toEqual([]);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), apiKey)).toBe("api-B");
});

test("reconectar con la misma API no recarga y con otra API sí", async ({ page }) => {
  let apiVersion = "api-A";
  let connections = 0;
  await page.routeWebSocket(socketUrl, (socket) => {
    connections++;
    socket.send(JSON.stringify({ type: "api-version", version: apiVersion }));
  });
  await openApiClient(page);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), apiKey))
    .toBe("api-A");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => connections).toBe(2);
  expect(await page.evaluate(() => (window as unknown as DeploymentWindow).updates)).toEqual([]);
  apiVersion = "api-B";
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DeploymentWindow).updates.length))
    .toBe(1);
  expect(await page.evaluate(() => (window as unknown as DeploymentWindow).updates[0].target)).toBe(
    "api",
  );
});

test("recupera un deploy de API perdido al cerrarse el WebSocket", async ({ page }) => {
  let close: () => void = () => {};
  let connections = 0;
  await page.routeWebSocket(socketUrl, (socket) => {
    connections++;
    close = () => socket.close();
    socket.send(
      JSON.stringify({ type: "api-version", version: connections === 1 ? "api-A" : "api-B" }),
    );
  });
  await openApiClient(page);
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), apiKey))
    .toBe("api-A");
  close();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DeploymentWindow).updates.length))
    .toBe(1);
  expect(
    await page.evaluate(() => (window as unknown as DeploymentWindow).updates[0].version),
  ).toBe("api-B");
});

test("si se pospone la recarga de API, se conserva la referencia anterior para reintentar", async ({
  page,
}) => {
  let apiVersion = "api-A";
  await page.routeWebSocket(socketUrl, (socket) =>
    socket.send(JSON.stringify({ type: "api-version", version: apiVersion })),
  );
  await openApiClient(page, { accept: false });
  await expect
    .poll(() => page.evaluate((key) => sessionStorage.getItem(key), apiKey))
    .toBe("api-A");
  apiVersion = "api-B";
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DeploymentWindow).updates.length))
    .toBe(1);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), apiKey)).toBe("api-A");
  await page.evaluate(() => {
    (window as unknown as DeploymentWindow).acceptUpdate = true;
    window.dispatchEvent(new Event("online"));
  });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DeploymentWindow).updates.length))
    .toBe(2);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), apiKey)).toBe("api-B");
});
