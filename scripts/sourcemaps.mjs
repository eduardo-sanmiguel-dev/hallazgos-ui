// Source maps de producción: se sacan de dist (no se publican) y se suben a
// OpenObserve, que traduce con ellos los stack traces de los errores de RUM.
import { crc32, deflateRawSync } from "node:zlib";
import { mkdir, readdir, rename, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

/** Rutas relativas (con "/") de todos los .map dentro de `root`. */
export async function findSourceMaps(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".map"))
    .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"))
    .sort();
}

/** Mueve los .map de `distDir` a `outDir` conservando su ruta (assets/x.js.map). */
export async function moveSourceMaps(distDir, outDir) {
  const files = await findSourceMaps(distDir);
  for (const file of files) {
    const target = join(outDir, file);
    await mkdir(dirname(target), { recursive: true });
    await rename(join(distDir, file), target);
  }
  return files;
}

/**
 * ZIP mínimo (deflate, nombres UTF-8, sin zip64): lo que pide OpenObserve.
 * Evita depender de `zip`/python en el servidor de deploy.
 */
export function createZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const fileName = Buffer.from(name, "utf8");
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versión necesaria
    local.writeUInt16LE(0x0800, 6); // nombre en UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10); // hora DOS
    local.writeUInt16LE(0x21, 12); // fecha DOS: 1980-01-01
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, fileName, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, fileName);
    offset += local.length + fileName.length + compressed.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDirectory, end]);
}

/** ZIP con los .map de `dir`, cada uno en su ruta relativa (assets/x.js.map). */
export async function zipSourceMaps(dir) {
  const files = await findSourceMaps(dir);
  const entries = [];
  for (const name of files) entries.push({ name, data: await readFile(join(dir, name)) });
  return { files, zip: createZip(entries) };
}

/** POST /api/{org}/sourcemaps (multipart: service, version, env, file). */
export async function uploadSourceMaps({
  url,
  org,
  credentials,
  service,
  version,
  env,
  zip,
  fetchImpl = fetch,
  timeoutMs = 120_000,
}) {
  const form = new FormData();
  form.append("service", service);
  form.append("version", version);
  form.append("env", env);
  form.append("file", new Blob([zip], { type: "application/zip" }), "sourcemaps.zip");
  const response = await fetchImpl(`${url.replace(/\/+$/, "")}/api/${org}/sourcemaps`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(credentials).toString("base64")}` },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  if (!response.ok)
    throw new Error(`OpenObserve respondió ${response.status}: ${text.slice(0, 300)}`);
  return text;
}

/**
 * Versiones a borrar: se conservan las `keep` más recientes (por fecha de
 * subida) y nunca la que se acaba de publicar.
 */
export function versionsToPrune(entries, { keep, current }) {
  const latest = new Map();
  for (const { version, created_at: createdAt = 0 } of entries) {
    if (!version) continue;
    latest.set(version, Math.max(latest.get(version) ?? 0, Number(createdAt) || 0));
  }
  return [...latest]
    .sort((a, b) => b[1] - a[1])
    .slice(Math.max(1, keep))
    .map(([version]) => version)
    .filter((version) => version !== current);
}

/**
 * Borra de OpenObserve los source maps de versiones viejas (cada deploy sube
 * ~6 MB). Las últimas `keep` cubren pestañas que aún no recargan.
 */
export async function pruneSourceMaps({
  url,
  org,
  credentials,
  service,
  env,
  keep,
  current,
  fetchImpl = fetch,
  timeoutMs = 60_000,
}) {
  const base = `${url.replace(/\/+$/, "")}/api/${org}/sourcemaps`;
  const headers = { Authorization: `Basic ${Buffer.from(credentials).toString("base64")}` };
  const listed = await fetchImpl(`${base}?${new URLSearchParams({ service, env })}`, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!listed.ok) throw new Error(`OpenObserve respondió ${listed.status} al listar`);
  const stale = versionsToPrune(await listed.json(), { keep, current });
  for (const version of stale) {
    const response = await fetchImpl(`${base}?${new URLSearchParams({ service, version, env })}`, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok)
      throw new Error(`OpenObserve respondió ${response.status} al borrar ${version}`);
  }
  return stale;
}
