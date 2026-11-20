import { readdir, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { constants, gzipSync } from "node:zlib";

// Precompresión de los assets del build: junto a cada archivo de texto queda
// su `.gz` (nivel 9, una sola vez). nginx los entrega con `gzip_static` y
// scripts/serve.mjs también; antes Node comprimía cada archivo en cada
// petición (~190 ms por JS en producción).

/** Tipos que conviene comprimir (imágenes y fuentes ya vienen comprimidas). */
export const COMPRESSIBLE = /\.(?:js|mjs|css|json|svg|webmanifest|html|txt)$/i;

/** Por debajo de esto el `.gz` no compensa (cabeceras y una petición). */
export const MIN_BYTES = 1024;

/**
 * Escribe `<archivo>.gz` para cada asset comprimible de `dir` (recursivo).
 * Solo si pesa menos que el original, con la misma fecha de modificación
 * (gzip_static compara contra el original). Nunca toca los source maps.
 */
export async function precompressAssets(dir) {
  const written = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      written.push(...(await precompressAssets(file)));
      continue;
    }
    if (!COMPRESSIBLE.test(entry.name)) continue;
    const content = await readFile(file);
    if (content.length < MIN_BYTES) continue;
    const gz = gzipSync(content, { level: constants.Z_BEST_COMPRESSION });
    if (gz.length >= content.length) continue;
    await writeFile(`${file}.gz`, gz);
    const { atime, mtime } = await stat(file);
    await utimes(`${file}.gz`, atime, mtime);
    written.push(`${file}.gz`);
  }
  return written;
}
