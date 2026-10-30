import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import ts from "typescript";

// Se prueba el cliente real en Chrome, sin API, BD ni credenciales.
const source = ts.transpileModule(
  readFileSync(join(process.cwd(), "app/_services/deploymentUpdates.ts"), "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } },
).outputText.replace("export function connectDeploymentUpdates", "window.connectDeploymentUpdates = function");

test("recarga una sola vez con una versión distinta e ignora mensajes inválidos", async ({ page }) => {
  let send: (message: string) => void = () => {};
  await page.routeWebSocket("wss://api.example/deployments/ws", (socket) => {
    send = (message) => socket.send(message);
  });
  await page.goto("about:blank");
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    const state = window as unknown as {
      updates: number;
      connectDeploymentUpdates: (url: string, version: string, callback: () => boolean) => () => void;
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
  await expect.poll(() => page.evaluate(() => (window as unknown as { updates: number }).updates)).toBe(1);
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
      connectDeploymentUpdates: (url: string, version: string, callback: () => boolean) => () => void;
    };
    state.updates = 0;
    state.connectDeploymentUpdates("wss://api.example/deployments/ws", "build-A", () => {
      state.updates++;
      return true;
    });
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { updates: number }).updates)).toBe(1);
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
      connectDeploymentUpdates: (url: string, version: string, callback: (version: string) => Promise<boolean>) => () => void;
    };
    state.updates = [];
    state.connectDeploymentUpdates("wss://api.example/deployments/ws", "build-B", async (version) => {
      state.updates.push(version);
      return version === "build-C";
    });
  });
  send(JSON.stringify({ type: "ui-version", version: "build-A" }));
  await expect.poll(() => page.evaluate(() => (window as unknown as { updates: string[] }).updates)).toEqual(["build-A"]);
  send(JSON.stringify({ type: "ui-version", version: "build-C" }));
  await expect.poll(() => page.evaluate(() => (window as unknown as { updates: string[] }).updates)).toEqual(["build-A", "build-C"]);
});
