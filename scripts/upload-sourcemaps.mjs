// Uso (deploy-production.sh, después de `pnpm build`):
//   node scripts/upload-sourcemaps.mjs <dist> <carpeta privada del release>
//
// 1. Mueve los .map fuera de dist (nunca se publican). Si no lo logra, falla
//    el deploy: publicarlos expondría todo el código fuente.
// 2. Los sube a OpenObserve con el service, versión y env que manda RUM. Si
//    la subida falla solo avisa: el monitoreo nunca bloquea un deploy (se
//    pueden subir después desde la carpeta privada).
// 3. Tras subirlos, borra de OpenObserve las versiones viejas: conserva las
//    últimas SOURCEMAPS_KEEP (10). Si falla, solo avisa.
//
// Variables (opcionales):
//   O2_URL (http://127.0.0.1:5080), O2_ORG (default)
//   O2_SOURCEMAPS_CREDENTIALS_FILE (~/.o2_token): "usuario:contraseña"
//   SOURCEMAPS_KEEP (10): versiones que se conservan en OpenObserve
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import {
  findSourceMaps,
  moveSourceMaps,
  pruneSourceMaps,
  uploadSourceMaps,
  zipSourceMaps,
} from "./sourcemaps.mjs";

// Deben coincidir con app/observability.ts.
const SERVICE = "ui-comportarte";
const ENV = "production";
const keepValue = Number(process.env.SOURCEMAPS_KEEP);
const KEEP = Number.isInteger(keepValue) && keepValue >= 1 ? keepValue : 10;

const [distArg, outArg] = process.argv.slice(2);
if (!distArg || !outArg) {
  console.error("Uso: node scripts/upload-sourcemaps.mjs <dist> <carpeta-privada>");
  process.exit(2);
}
const dist = resolve(distArg);
const out = resolve(outArg);

const moved = await moveSourceMaps(dist, out);
const left = await findSourceMaps(dist);
if (left.length) {
  console.error(`ERROR: quedaron ${left.length} source maps en ${dist}; no se publica.`);
  process.exit(1);
}
console.log(`Source maps fuera de dist: ${moved.length} → ${out}`);
if (!moved.length) {
  console.warn("AVISO: el build no generó source maps; los errores de RUM se verán minificados.");
  process.exit(0);
}

const describe = (error) => {
  // "fetch failed" sola no dice nada: la causa trae el código de red (p. ej.
  // OpenObserve corta la conexión al rechazar credenciales a media subida).
  const cause = error.cause?.code || error.cause?.message;
  return `${error.message}${cause ? `: ${cause}` : ""}`;
};
const o2 = {
  url: process.env.O2_URL || "http://127.0.0.1:5080",
  org: process.env.O2_ORG || "default",
};

let uploaded = false;
let version;
let credentials;
try {
  ({ version } = JSON.parse(await readFile(join(dist, "deployment-version.json"), "utf8")));
  const credentialsFile =
    process.env.O2_SOURCEMAPS_CREDENTIALS_FILE || join(homedir(), ".o2_token");
  credentials = (await readFile(credentialsFile, "utf8")).trim();
  const { zip } = await zipSourceMaps(out);
  await uploadSourceMaps({
    ...o2,
    credentials,
    service: SERVICE,
    version,
    env: ENV,
    zip,
  });
  console.log(
    `Source maps subidos a OpenObserve: ${SERVICE} ${version} (${Math.round(zip.length / 1024)} KB)`,
  );
  uploaded = true;
} catch (error) {
  console.warn(
    `AVISO: no se subieron los source maps a OpenObserve (${describe(error)}). ` +
      `Siguen en ${out} para subirlos después; el deploy continúa.`,
  );
}

// Solo tras una subida correcta: nunca dejar OpenObserve sin la versión actual.
if (uploaded) {
  try {
    const removed = await pruneSourceMaps({
      ...o2,
      credentials,
      service: SERVICE,
      env: ENV,
      keep: KEEP,
      current: version,
    });
    console.log(
      `Source maps en OpenObserve: se conservan las últimas ${KEEP} versiones` +
        (removed.length ? `; borradas ${removed.length}: ${removed.join(", ")}` : ""),
    );
  } catch (error) {
    console.warn(`AVISO: no se limpiaron versiones viejas de source maps (${describe(error)}).`);
  }
}
