import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// Solo se ejecuta DESPUÉS del health check del despliegue. La API observa
// este directorio; el rename evita que lea un JSON escrito a medias.
const file = process.env.UI_VERSION_FILE ||
  join(homedir(), ".local", "state", "hallazgos", "ui-version.json");
const version = (await readFile(".next/BUILD_ID", "utf8")).trim();
const url = new URL("/api/deployment-version", process.env.UI_URL || "http://127.0.0.1:3000");
const response = await fetch(url, {
  cache: "no-store",
  signal: AbortSignal.timeout(10_000),
});
if (!response.ok || (await response.json()).version !== version) {
  throw new Error("La UI activa no corresponde al build: no se publica la versión.");
}
await mkdir(dirname(file), { recursive: true, mode: 0o700 });
const temporary = `${file}.${process.pid}.tmp`;
await writeFile(temporary, JSON.stringify({ version }), { mode: 0o600 });
await rename(temporary, file);
console.log(`Versión de UI publicada: ${version}`);
