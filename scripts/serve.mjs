import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { constants, createBrotliCompress, createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { realpath, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

// Optional PM2 server; dist can also be served directly by Nginx.
const root = await realpath(resolve(process.env.UI_DIST_DIR || "dist"));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
};
// Caché en el navegador según el archivo:
// - /assets/: nombre con hash (cambia con su contenido), 1 año sin revalidar.
// - HTML (rutas de la SPA) y la versión del deploy: nunca, para que una pestaña
//   vea el deploy nuevo en cuanto existe.
// - El resto de public/ (íconos, logos, planos, manifest) no lleva hash: 1 día,
//   y 7 más entregando la copia guardada mientras se revalida en segundo plano
//   (ETag/Last-Modified: si no cambió, 304 sin volver a descargarlo). Antes
//   iban con no-store y, p. ej., planos.webp (4 MB) se bajaba en cada vista.
const NO_STORE = "no-store";
const cacheControl = (pathname, file) => {
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (extname(file) === ".html" || pathname === "/deployment-version.json") return NO_STORE;
  return "public, max-age=86400, stale-while-revalidate=604800";
};
// Validadores del archivo original (no del .br/.gz): cambian con cada deploy.
const etagOf = (info) => `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
const isFresh = (req, etag, lastModified) => {
  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch)
    return ifNoneMatch.split(",").some((tag) => tag.trim() === etag || tag.trim() === "*");
  const ifModifiedSince = Date.parse(req.headers["if-modified-since"] ?? "");
  return !Number.isNaN(ifModifiedSince) && Date.parse(lastModified) <= ifModifiedSince;
};
const server = createServer(async (req, res) => {
  const fail = (status) => {
    // Navegar/cerrar una pestaña puede cancelar el stream mientras leemos el disco.
    // Una respuesta iniciada o cerrada no admite otro juego de cabeceras.
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.writeHead(status);
    res.end();
  };
  if (req.headers["next-action"] !== undefined) return fail(400);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return fail(405);
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    return fail(400);
  }
  if (pathname.includes("\\") || pathname.includes("\0")) return fail(400);
  // Los source maps son privados (se suben a OpenObserve en el deploy): aunque
  // alguno quedara en dist, nunca se entregan; exponían todo el código fuente.
  // Los `.br`/`.gz` precomprimidos solo se entregan como Content-Encoding.
  if (/\.(?:map|gz|br)$/i.test(pathname)) return fail(404);
  if (pathname === "/api/deployment-version") pathname = "/deployment-version.json";
  let file = resolve(root, `.${pathname}`);
  if (!file.startsWith(root + sep) && file !== root) return fail(403);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    // Unknown assets must be 404s; HTML fallback is only for browser routes.
    if (extname(pathname) || pathname.startsWith("/assets/") || pathname.startsWith("/api/"))
      return fail(404);
    file = resolve(root, "index.html");
  }
  try {
    const actual = await realpath(file);
    if (!actual.startsWith(root + sep)) return fail(403);
    const info = await stat(actual);
    if (res.destroyed || res.writableEnded) return;
    res.setHeader("Content-Type", mime[extname(actual)] || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const cache = cacheControl(pathname, actual);
    res.setHeader("Cache-Control", cache);
    if (cache !== NO_STORE) {
      const etag = etagOf(info);
      const lastModified = new Date(info.mtimeMs).toUTCString();
      res.setHeader("ETag", etag);
      res.setHeader("Last-Modified", lastModified);
      if (isFresh(req, etag, lastModified)) {
        res.setHeader("Vary", "Accept-Encoding");
        res.writeHead(304);
        return res.end();
      }
    }
    // Brotli a quien lo acepta (~14 % menos que gzip) y gzip a los demás.
    const accepted = req.headers["accept-encoding"] || "";
    const encoding =
      info.size > 1024 && /\.(html|js|css|json|svg|webmanifest)$/.test(actual)
        ? /\bbr\b/.test(accepted)
          ? "br"
          : /\bgzip\b/.test(accepted)
            ? "gzip"
            : null
        : null;
    // El build deja `<archivo>.br` y `.gz` (scripts/precompress.mjs): se
    // entregan tal cual en lugar de comprimir en cada petición.
    const precompressedFile = encoding && `${actual}.${encoding === "br" ? "br" : "gz"}`;
    const precompressed = precompressedFile
      ? await stat(precompressedFile).catch(() => null)
      : null;
    res.setHeader("Vary", "Accept-Encoding");
    if (encoding) res.setHeader("Content-Encoding", encoding);
    if (precompressed) res.setHeader("Content-Length", precompressed.size);
    else if (!encoding) res.setHeader("Content-Length", info.size);
    res.writeHead(200);
    if (req.method === "HEAD") return res.end();
    if (precompressed) return await pipeline(createReadStream(precompressedFile), res);
    const stream = createReadStream(actual);
    // Sin precomprimido (el HTML): al vuelo. Brotli con calidad media: la
    // máxima tarda demasiado para hacerlo en cada petición.
    if (encoding === "br")
      await pipeline(
        stream,
        createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }),
        res,
      );
    else if (encoding) await pipeline(stream, createGzip(), res);
    else await pipeline(stream, res);
  } catch {
    fail(404);
  }
});
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const displayHost = host.includes(":") ? `[${host}]` : host;
server.listen(port, host, () =>
  console.log(`UI estática en http://${displayHost}:${server.address().port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
