import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { precompressAssets } from "./precompress.mjs";

// The bundle and the published JSON always share one deployment ID.
const version = randomUUID();
console.log(`Versión de UI: ${version}`);
const result = spawnSync(
  process.execPath,
  ["scripts/toolchain.mjs", "build", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, VITE_APP_VERSION: version },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
// `.gz` de cada asset para nginx (gzip_static) y scripts/serve.mjs, en la
// carpeta de salida real (las e2e compilan con --outDir dist.e2e).
const args = process.argv.slice(2);
const outDirFlag = args.indexOf("--outDir");
const outDir = outDirFlag >= 0 ? args[outDirFlag + 1] : (process.env.VITE_BUILD_OUT_DIR ?? "dist");
const assetsDir = join(outDir, "assets");
const written = existsSync(assetsDir) ? await precompressAssets(assetsDir) : [];
console.log(`Assets precomprimidos: ${written.length}`);
