import { readdir, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

// Precompresión de los assets del build: junto a cada archivo de texto queda
// su `.br` (brotli 11) y su `.gz` (gzip 9), una sola vez. nginx los entrega
// con `brotli_static` / `gzip_static` y scripts/serve.mjs también: brotli a
// quien lo acepta (~14 % menos que gzip) y gzip a los demás.

/** Tipos que conviene comprimir (imágenes y fuentes ya vienen comprimidas). */
export const COMPRESSIBLE = /\.(?:js|mjs|css|json|svg|webmanifest|html|txt)$/i;

/** Por debajo de esto no compensa (cabeceras y una petición). */
export const MIN_BYTES = 1024;

const ENCODERS = {
  br: (content) =>
    brotliCompressSync(content, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: content.length,
      },
    }),
  gz: (content) => gzipSync(content, { level: constants.Z_BEST_COMPRESSION }),
};

/**
 * Escribe `<archivo>.br` y `<archivo>.gz` para cada asset comprimible de
 * `dir` (recursivo). Cada uno solo si pesa menos que el original, con la
 * misma fecha de modificación (gzip_static/brotli_static la comparan).
 * Nunca toca los source maps.
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
    const { atime, mtime } = await stat(file);
    for (const [extension, encode] of Object.entries(ENCODERS)) {
      const compressed = encode(content);
      if (compressed.length >= content.length) continue;
      const target = `${file}.${extension}`;
      await writeFile(target, compressed);
      await utimes(target, atime, mtime);
      written.push(target);
    }
  }
  return written;
}
