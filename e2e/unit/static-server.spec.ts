import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { spawn, type ChildProcess } from "node:child_process";
import { get } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { join, resolve } from "node:path";

import { SECURITY_HEADERS_FILE, securityHeaders } from "../../scripts/csp.mjs";

let child: ChildProcess;
let directory: string;
let origin: string;
const serverErrors: string[] = [];
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "hallazgos-ui-static-"));
  await mkdir(join(directory, "assets"));
  // Más de 1 KB: el HTML se comprime al vuelo.
  await writeFile(
    join(directory, "index.html"),
    '<div id="root">ComportArte</div>' + "<!-- relleno -->".repeat(100),
  );
  await writeFile(join(directory, "assets/main-test.js"), 'console.log("UI")');
  await writeFile(join(directory, "assets/main-test.js.map"), '{"version":3,"sources":[]}');
  await writeFile(join(directory, "assets/cancel-test.js"), randomBytes(4 * 1024 * 1024));
  // Precomprimido por el build (scripts/precompress.mjs). Cada versión lleva
  // otro texto a propósito: así se nota cuál se entregó.
  await writeFile(join(directory, "assets/pre-test.js"), "// original\n".repeat(200));
  await writeFile(
    join(directory, "assets/pre-test.js.gz"),
    gzipSync("// precomprimido\n".repeat(200)),
  );
  await writeFile(
    join(directory, "assets/pre-test.js.br"),
    brotliCompressSync("// brotli\n".repeat(200)),
  );
  // Archivos de public/ sin hash (logos, íconos, manifest).
  await mkdir(join(directory, "images"));
  await writeFile(join(directory, "images/plano-test.webp"), randomBytes(2048));
  await writeFile(join(directory, "manifest.webmanifest"), '{"name":"HADA"}');
  await writeFile(
    join(directory, "deployment-version.json"),
    JSON.stringify({ version: "test-build" }),
  );
  // Las cabeceras que deja el build (vite.config.ts).
  await writeFile(
    join(directory, SECURITY_HEADERS_FILE),
    JSON.stringify(securityHeaders({ apiOrigin: "https://api.example.test" })),
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
test("envía las cabeceras de seguridad en páginas y archivos", async () => {
  for (const path of ["/", "/hallazgos", "/assets/main-test.js"]) {
    const response = await fetch(origin + path);
    const header = (name: string) => response.headers.get(name);
    expect(header("content-security-policy"), path).toContain("script-src 'self'");
    expect(header("content-security-policy"), path).toContain("frame-ancestors 'none'");
    expect(header("strict-transport-security"), path).toBe("max-age=31536000");
    expect(header("x-frame-options"), path).toBe("DENY");
    expect(header("x-content-type-options"), path).toBe("nosniff");
    expect(header("referrer-policy"), path).toBe("strict-origin-when-cross-origin");
    expect(header("permissions-policy"), path).toContain("camera=(self)");
    expect(header("cross-origin-opener-policy"), path).toBe("same-origin");
    await response.arrayBuffer();
  }
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
test("el HTML y la versión del deploy no llevan validadores (siempre se descargan)", async () => {
  for (const path of ["/", "/deployment-version.json"]) {
    const response = await fetch(origin + path, { headers: { "If-None-Match": "*" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBeNull();
  }
});
test("cachea 1 día los archivos de public/ sin hash y revalida con 304", async () => {
  for (const path of ["/images/plano-test.webp", "/manifest.webmanifest"]) {
    const first = await fetch(origin + path);
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe(
      "public, max-age=86400, stale-while-revalidate=604800",
    );
    const etag = first.headers.get("etag")!;
    const lastModified = first.headers.get("last-modified")!;
    expect(etag).toMatch(/^W\/"[0-9a-f]+-[0-9a-f]+"$/);
    await first.arrayBuffer();

    // Sin cambios: 304 sin cuerpo, por ETag o por fecha.
    for (const headers of <Record<string, string>[]>[
      { "If-None-Match": `"otro", ${etag}` },
      { "If-Modified-Since": lastModified },
    ]) {
      const revalidated = await fetch(origin + path, { headers });
      expect(revalidated.status).toBe(304);
      expect(await revalidated.text()).toBe("");
    }

    // Otra versión del archivo (ETag viejo) o fecha anterior: se descarga.
    for (const headers of <Record<string, string>[]>[
      { "If-None-Match": 'W/"0-0"' },
      { "If-Modified-Since": new Date(Date.parse(lastModified) - 60_000).toUTCString() },
    ]) {
      const changed = await fetch(origin + path, { headers });
      expect(changed.status).toBe(200);
      await changed.arrayBuffer();
    }
  }
});
test("los assets con hash también responden 304 si el navegador revalida", async () => {
  const asset = await fetch(`${origin}/assets/main-test.js`);
  await asset.text();
  const revalidated = await fetch(`${origin}/assets/main-test.js`, {
    headers: { "If-None-Match": asset.headers.get("etag")! },
  });
  expect(revalidated.status).toBe(304);
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

test("con brotli aceptado entrega el .br precomprimido; el HTML, al vuelo", async () => {
  const br = await fetch(`${origin}/assets/pre-test.js`, {
    headers: { "Accept-Encoding": "gzip, deflate, br" },
  });
  expect(br.headers.get("content-encoding")).toBe("br");
  expect(br.headers.get("vary")).toBe("Accept-Encoding");
  expect(await br.text()).toContain("// brotli");

  const html = await fetch(`${origin}/hallazgos`, { headers: { "Accept-Encoding": "br" } });
  expect(html.headers.get("content-encoding")).toBe("br");
  expect(await html.text()).toContain('id="root"');

  expect((await fetch(`${origin}/assets/pre-test.js.br`)).status).toBe(404);
});

test("entrega el .gz precomprimido en lugar de comprimir en cada petición", async () => {
  const gzip = await fetch(`${origin}/assets/pre-test.js`, {
    headers: { "Accept-Encoding": "gzip" },
  });
  expect(gzip.headers.get("content-encoding")).toBe("gzip");
  expect(gzip.headers.get("cache-control")).toContain("immutable");
  expect(Number(gzip.headers.get("content-length"))).toBeGreaterThan(0);
  expect(await gzip.text()).toContain("// precomprimido");

  // Sin gzip, el original.
  const plain = await fetch(`${origin}/assets/pre-test.js`, {
    headers: { "Accept-Encoding": "identity" },
  });
  expect(plain.headers.get("content-encoding")).toBeNull();
  expect(await plain.text()).toContain("// original");

  // El .gz nunca se pide directo.
  expect((await fetch(`${origin}/assets/pre-test.js.gz`)).status).toBe(404);
});
