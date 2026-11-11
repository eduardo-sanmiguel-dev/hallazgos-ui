import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { spawn, type ChildProcess } from "node:child_process";
import { get } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

let child: ChildProcess;
let directory: string;
let origin: string;
const serverErrors: string[] = [];
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "hallazgos-ui-static-"));
  await mkdir(join(directory, "assets"));
  await writeFile(join(directory, "index.html"), '<div id="root">ComportArte</div>');
  await writeFile(join(directory, "assets/main-test.js"), 'console.log("UI")');
  await writeFile(join(directory, "assets/main-test.js.map"), '{"version":3,"sources":[]}');
  await writeFile(join(directory, "assets/cancel-test.js"), randomBytes(4 * 1024 * 1024));
  await writeFile(
    join(directory, "deployment-version.json"),
    JSON.stringify({ version: "test-build" }),
  );
  child = spawn(process.execPath, [resolve("scripts/serve.mjs")], {
    env: { ...process.env, UI_DIST_DIR: directory, PORT: "0", HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  origin = await new Promise<string>((resolveOrigin, reject) => {
    child.on("error", reject);
    child.stderr!.on("data", (data) => {
      serverErrors.push(String(data));
      reject(new Error(String(data)));
    });
    child.stdout!.on("data", (data) => {
      const match = String(data).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) resolveOrigin(match[0]);
    });
  });
});
afterAll(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise((resolveExit) => child.once("exit", resolveExit));
    child.kill();
    await exited;
  }
  if (directory && resolve(directory).startsWith(join(tmpdir(), "hallazgos-ui-static-"))) {
    await rm(directory, { recursive: true, force: true });
  }
});
test("sirve enlaces directos con parámetros y evita cachear HTML", async () => {
  const response = await fetch(`${origin}/hallazgos/form?evidenceId=123`);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).toContain('id="root"');
});
test("mantiene el endpoint de versión de pestañas anteriores", async () => {
  for (const path of ["/deployment-version.json", "/api/deployment-version"]) {
    const response = await fetch(origin + path);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ version: "test-build" });
  }
});
test("cachea assets con hash y no responde HTML para assets inexistentes", async () => {
  const asset = await fetch(`${origin}/assets/main-test.js`);
  expect(asset.headers.get("cache-control")).toContain("immutable");
  expect(asset.headers.get("content-type")).toContain("javascript");
  for (const path of ["/assets/missing.js", "/api/missing", "/missing.png"]) {
    expect((await fetch(origin + path)).status).toBe(404);
  }
});
test("nunca entrega source maps aunque existan en dist", async () => {
  for (const path of ["/assets/main-test.js.map", "/assets/MAIN-TEST.JS.MAP"]) {
    const response = await fetch(origin + path);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  }
});
test("rechaza escrituras, Server Actions antiguas y rutas con separadores inválidos", async () => {
  expect((await fetch(origin, { method: "POST" })).status).toBe(405);
  expect((await fetch(origin, { headers: { "next-action": "invalid" } })).status).toBe(400);
  expect(
    (await fetch(origin, { method: "POST", headers: { "next-action": "invalid" } })).status,
  ).toBe(400);
  expect((await fetch(`${origin}/%5c..%5csecret`)).status).toBe(400);
  const head = await fetch(origin, { method: "HEAD" });
  expect(head.status).toBe(200);
  expect(await head.text()).toBe("");
});

test("mantiene el servidor activo cuando clientes cancelan descargas simultáneas", async () => {
  await Promise.all(
    Array.from(
      { length: 48 },
      (_, index) =>
        new Promise<void>((resolveAbort) => {
          const request = get(
            `${origin}/assets/cancel-test.js`,
            {
              headers: index % 2 ? { "Accept-Encoding": "gzip" } : {},
            },
            (response) => {
              if (index % 3 === 1) response.destroy();
              else response.once("data", () => response.destroy());
            },
          );
          if (index % 3 === 0) request.once("finish", () => request.destroy());
          request.once("error", () => resolveAbort());
          request.once("close", () => resolveAbort());
        }),
    ),
  );
  // También debe seguir atendiendo nuevas peticiones después de los abortos.
  for (let index = 0; index < 5; index++) {
    const response = await fetch(`${origin}/deployment-version.json`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: "test-build" });
  }
  expect(child.exitCode).toBeNull();
  expect(serverErrors.join("")).not.toContain("ERR_HTTP_HEADERS_SENT");
});
