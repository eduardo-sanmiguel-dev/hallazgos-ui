import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

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
process.exit(result.status ?? 1);
