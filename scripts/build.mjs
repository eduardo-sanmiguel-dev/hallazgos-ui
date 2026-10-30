import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

// Un ID nuevo incluso al redesplegar el mismo commit. Se incorpora al bundle
// del navegador y a .next/BUILD_ID durante la misma compilación.
const version = randomUUID();
console.log(`Versión de UI: ${version}`);
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_APP_VERSION: version },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
