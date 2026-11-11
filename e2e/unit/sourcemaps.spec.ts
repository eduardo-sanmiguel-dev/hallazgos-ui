import { afterEach, describe, expect, test } from "vite-plus/test";
import { crc32, inflateRawSync } from "node:zlib";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createZip,
  findSourceMaps,
  moveSourceMaps,
  uploadSourceMaps,
  zipSourceMaps,
} from "../../scripts/sourcemaps.mjs";

// Source maps del deploy: fuera de dist (no se publican) y a OpenObserve.

/** Lee un ZIP por su directorio central (como lo haría OpenObserve). */
const readZip = (zip: Buffer) => {
  const end = zip.length - 22;
  expect(zip.readUInt32LE(end)).toBe(0x06054b50);
  const count = zip.readUInt16LE(end + 10);
  let pointer = zip.readUInt32LE(end + 16);
  const files: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(pointer)).toBe(0x02014b50);
    const crc = zip.readUInt32LE(pointer + 16);
    const size = zip.readUInt32LE(pointer + 20);
    const nameLength = zip.readUInt16LE(pointer + 28);
    const offset = zip.readUInt32LE(pointer + 42);
    const name = zip.subarray(pointer + 46, pointer + 46 + nameLength).toString("utf8");
    expect(zip.readUInt32LE(offset)).toBe(0x04034b50);
    const localName = zip.readUInt16LE(offset + 26);
    const start = offset + 30 + localName;
    const data = inflateRawSync(zip.subarray(start, start + size));
    expect(crc32(data)).toBe(crc);
    files[name] = data.toString("utf8");
    pointer += 46 + nameLength;
  }
  return files;
};

const dirs: string[] = [];
const tempDir = async () => {
  const dir = await mkdtemp(join(tmpdir(), "hallazgos-sourcemaps-"));
  dirs.push(dir);
  return dir;
};
afterEach(async () => {
  for (const dir of dirs.splice(0)) await rm(dir, { recursive: true, force: true });
});

describe("source maps del deploy", () => {
  test("el ZIP conserva rutas y contenido (CRC y deflate válidos)", () => {
    const zip = createZip([
      { name: "assets/index-abc.js.map", data: Buffer.from('{"version":3,"file":"index"}') },
      { name: "assets/página-ñ.js.map", data: Buffer.from("x".repeat(5000)) },
    ]);
    expect(readZip(zip)).toEqual({
      "assets/index-abc.js.map": '{"version":3,"file":"index"}',
      "assets/página-ñ.js.map": "x".repeat(5000),
    });
  });

  test("mueve todos los .map fuera de dist y deja el resto", async () => {
    const dist = await tempDir();
    const out = join(await tempDir(), "sourcemaps");
    await mkdir(join(dist, "assets", "nested"), { recursive: true });
    await writeFile(join(dist, "index.html"), "<div></div>");
    await writeFile(join(dist, "assets", "a.js"), "a");
    await writeFile(join(dist, "assets", "a.js.map"), "{}");
    await writeFile(join(dist, "assets", "nested", "b.css.map"), "{}");

    expect(await moveSourceMaps(dist, out)).toEqual(["assets/a.js.map", "assets/nested/b.css.map"]);
    expect(await findSourceMaps(dist)).toEqual([]);
    expect(await readFile(join(dist, "assets", "a.js"), "utf8")).toBe("a");
    const { files, zip } = await zipSourceMaps(out);
    expect(files).toEqual(["assets/a.js.map", "assets/nested/b.css.map"]);
    expect(Object.keys(readZip(zip))).toEqual(files);
  });

  test("sube a /api/{org}/sourcemaps con service, version, env y el zip", async () => {
    let request: { url: string; init: RequestInit } | undefined;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      request = { url, init };
      return new Response('{"code":201}', { status: 201 });
    }) as typeof fetch;
    await uploadSourceMaps({
      url: "http://127.0.0.1:5080/",
      org: "default",
      credentials: "sa@test:secreto",
      service: "ui-comportarte",
      version: "v-123",
      env: "production",
      zip: Buffer.from("zip"),
      fetchImpl,
    });

    expect(request!.url).toBe("http://127.0.0.1:5080/api/default/sourcemaps");
    expect(request!.init.method).toBe("POST");
    expect((request!.init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("sa@test:secreto").toString("base64")}`,
    );
    const form = request!.init.body as FormData;
    expect(form.get("service")).toBe("ui-comportarte");
    expect(form.get("version")).toBe("v-123");
    expect(form.get("env")).toBe("production");
    expect((form.get("file") as File).name).toBe("sourcemaps.zip");
  });

  test("un error de OpenObserve se informa con su código", async () => {
    const fetchImpl = (async () => new Response("sin permiso", { status: 403 })) as typeof fetch;
    await expect(
      uploadSourceMaps({
        url: "http://o2",
        org: "default",
        credentials: "a:b",
        service: "s",
        version: "v",
        env: "e",
        zip: Buffer.from(""),
        fetchImpl,
      }),
    ).rejects.toThrow("OpenObserve respondió 403: sin permiso");
  });
});
