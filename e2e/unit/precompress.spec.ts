import { afterEach, describe, expect, test } from "vite-plus/test";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { precompressAssets } from "../../scripts/precompress.mjs";

// Precompresión del build: un `.gz` por asset de texto, una sola vez, para
// que nginx (gzip_static) y serve.mjs no compriman en cada petición.

const dirs: string[] = [];
const tempDir = async () => {
  const dir = await mkdtemp(join(tmpdir(), "hallazgos-precompress-"));
  dirs.push(dir);
  return dir;
};
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  );

describe("precompressAssets", () => {
  test("comprime JS, CSS y SVG grandes; deja igual imágenes, mapas y archivos chicos", async () => {
    const dir = await tempDir();
    const js = "console.log('hallazgos');\n".repeat(200);
    await writeFile(join(dir, "index-abc.js"), js);
    await writeFile(join(dir, "index-abc.css"), "body{color:red}\n".repeat(200));
    await writeFile(join(dir, "logo.svg"), "<svg>" + "<g/>".repeat(400) + "</svg>");
    await writeFile(join(dir, "small.js"), "export{}");
    await writeFile(join(dir, "foto.png"), randomBytes(4096));
    await writeFile(join(dir, "index-abc.js.map"), '{"mappings":"' + "A".repeat(4000) + '"}');

    const written = await precompressAssets(dir);

    expect(written.map((file: string) => file.slice(dir.length + 1)).sort()).toEqual([
      "index-abc.css.gz",
      "index-abc.js.gz",
      "logo.svg.gz",
    ]);
    // El .gz es el mismo contenido.
    expect(gunzipSync(await readFile(join(dir, "index-abc.js.gz"))).toString()).toBe(js);
    for (const name of ["small.js.gz", "foto.png.gz", "index-abc.js.map.gz"]) {
      expect(await exists(join(dir, name))).toBe(false);
    }
  });

  test("conserva la fecha del original (gzip_static la compara)", async () => {
    const dir = await tempDir();
    const file = join(dir, "app.js");
    await writeFile(file, "x".repeat(5000));
    const date = new Date("2026-01-02T03:04:05Z");
    await utimes(file, date, date);

    await precompressAssets(dir);

    expect((await stat(`${file}.gz`)).mtime.toISOString()).toBe(date.toISOString());
  });

  test("no escribe el .gz si no pesa menos que el original", async () => {
    const dir = await tempDir();
    // Datos aleatorios: gzip no los reduce.
    await writeFile(join(dir, "random.js"), randomBytes(8192));

    expect(await precompressAssets(dir)).toEqual([]);
    expect(await exists(join(dir, "random.js.gz"))).toBe(false);
  });

  test("recorre subcarpetas", async () => {
    const dir = await tempDir();
    await mkdir(join(dir, "fonts"));
    await writeFile(join(dir, "fonts", "font.css"), "a{b:c}\n".repeat(500));

    expect(await precompressAssets(dir)).toEqual([join(dir, "fonts", "font.css.gz")]);
  });
});
