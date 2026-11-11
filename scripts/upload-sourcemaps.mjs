// Uso (deploy-production.sh, después de `pnpm build`):
//   node scripts/upload-sourcemaps.mjs <dist> <carpeta privada del release>
//
// 1. Mueve los .map fuera de dist (nunca se publican). Si no lo logra, falla
//    el deploy: publicarlos expondría todo el código fuente.
// 2. Los sube a OpenObserve con el service, versión y env que manda RUM. Si
//    la subida falla solo avisa: el monitoreo nunca bloquea un deploy (se
//    pueden subir después desde la carpeta privada).
//
// Variables (opcionales):
//   O2_URL (http://127.0.0.1:5080), O2_ORG (default)
//   O2_SOURCEMAPS_CREDENTIALS_FILE (~/.o2_token): "usuario:contraseña"
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

import { findSourceMaps, moveSourceMaps, uploadSourceMaps, zipSourceMaps } from "./sourcemaps.mjs";

// Deben coincidir con app/observability.ts.
const SERVICE = "ui-comportarte";
const ENV = "production";

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

try {
  const { version } = JSON.parse(await readFile(join(dist, "deployment-version.json"), "utf8"));
  const credentialsFile =
    process.env.O2_SOURCEMAPS_CREDENTIALS_FILE || join(homedir(), ".o2_token");
  const credentials = (await readFile(credentialsFile, "utf8")).trim();
  const { zip } = await zipSourceMaps(out);
  await uploadSourceMaps({
    url: process.env.O2_URL || "http://127.0.0.1:5080",
    org: process.env.O2_ORG || "default",
    credentials,
    service: SERVICE,
    version,
    env: ENV,
    zip,
  });
  console.log(
    `Source maps subidos a OpenObserve: ${SERVICE} ${version} (${Math.round(zip.length / 1024)} KB)`,
  );
} catch (error) {
  // "fetch failed" sola no dice nada: la causa trae el código de red (p. ej.
  // OpenObserve corta la conexión al rechazar credenciales a media subida).
  const cause = error.cause?.code || error.cause?.message;
  console.warn(
    `AVISO: no se subieron los source maps a OpenObserve (${error.message}${cause ? `: ${cause}` : ""}). ` +
      `Siguen en ${out} para subirlos después; el deploy continúa.`,
  );
}
