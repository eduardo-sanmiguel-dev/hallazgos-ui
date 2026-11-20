import { afterEach, describe, expect, test } from "vite-plus/test";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// publish_assets (scripts/deploy-production.sh): copia los assets del build a
// la carpeta pública que entrega nginx, sin pisar los de versiones anteriores
// (pestañas abiertas) y borrando los que ya no se publican.

// En Windows solo con el bash de Git: el de WSL no ve las rutas de Windows.
const uname = spawnSync("bash", ["-c", "uname -s"], { encoding: "utf8" });
const bashUsable =
  uname.status === 0 && (process.platform !== "win32" || /MINGW|MSYS/.test(uname.stdout));

const posix = (path: string) => path.replace(/\\/g, "/");
const script = posix(resolve("scripts/deploy-production.sh"));

// Carga el script sin desplegar (ver su final) y llama solo a publish_assets.
const publish = (release: string, assetsDir: string) =>
  spawnSync(
    "bash",
    [
      "-c",
      // $0 distinto de la ruta del script: así `source` no ejecuta main.
      'source "$1"; ASSETS_DIR="$2"; ASSETS_KEEP_DAYS=30; publish_assets "$3"',
      "prueba",
      script,
      posix(assetsDir),
      posix(release),
    ],
    { encoding: "utf8" },
  );

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const setup = async () => {
  const root = await mkdtemp(join(tmpdir(), "hallazgos-deploy-assets-"));
  dirs.push(root);
  const release = join(root, "release");
  await mkdir(join(release, "dist", "assets", "sub"), { recursive: true });
  await writeFile(join(release, "dist", "assets", "index-new.js"), "nuevo");
  await writeFile(join(release, "dist", "assets", "index-new.js.gz"), "gz");
  await writeFile(join(release, "dist", "assets", "index-new.js.br"), "br");
  await writeFile(join(release, "dist", "assets", "index-new.js.map"), "{}");
  await writeFile(join(release, "dist", "assets", "sub", "x.js"), "carpeta");
  return { root, release };
};

describe.skipIf(!bashUsable)("publish_assets", () => {
  test("copia assets, .br y .gz, nunca los source maps, y conserva los de versiones anteriores", async () => {
    const { root, release } = await setup();
    const assetsDir = join(root, "public");
    await mkdir(join(assetsDir, "assets"), { recursive: true });
    // De un despliegue anterior: una pestaña abierta todavía lo pide.
    await writeFile(join(assetsDir, "assets", "index-old.js"), "anterior");

    const result = publish(release, assetsDir);

    expect(result.status, result.stderr).toBe(0);
    expect((await readdir(join(assetsDir, "assets"))).sort()).toEqual([
      "index-new.js",
      "index-new.js.br",
      "index-new.js.gz",
      "index-old.js",
    ]);
    expect(await readFile(join(assetsDir, "assets", "index-new.js"), "utf8")).toBe("nuevo");
  });

  test("no reescribe un asset que ya existe (mismo hash) y renueva su fecha", async () => {
    const { root, release } = await setup();
    const assetsDir = join(root, "public");
    await mkdir(join(assetsDir, "assets"), { recursive: true });
    const existing = join(assetsDir, "assets", "index-new.js");
    await writeFile(existing, "ya publicado");
    const old = new Date(Date.now() - 10 * 24 * 3600 * 1000);
    await utimes(existing, old, old);

    expect(publish(release, assetsDir).status).toBe(0);

    expect(await readFile(existing, "utf8")).toBe("ya publicado");
    expect((await stat(existing)).mtimeMs).toBeGreaterThan(old.getTime());
  });

  test("borra los assets que no se publican hace más de 30 días", async () => {
    const { root, release } = await setup();
    const assetsDir = join(root, "public");
    await mkdir(join(assetsDir, "assets"), { recursive: true });
    const stale = join(assetsDir, "assets", "index-viejo.js");
    await writeFile(stale, "viejo");
    const longAgo = new Date(Date.now() - 40 * 24 * 3600 * 1000);
    await utimes(stale, longAgo, longAgo);

    expect(publish(release, assetsDir).status).toBe(0);

    await expect(stat(stale)).rejects.toThrow();
  });

  test("sin la carpeta pública solo avisa: Node sigue sirviendo /assets", async () => {
    const { root, release } = await setup();

    const result = publish(release, join(root, "no-existe"));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Node sigue sirviendo /assets");
  });
});
