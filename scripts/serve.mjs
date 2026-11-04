import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { createGzip } from "node:zlib";
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
  ".map": "application/json",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
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
    res.setHeader(
      "Cache-Control",
      pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-store",
    );
    const compress =
      /\bgzip\b/.test(req.headers["accept-encoding"] || "") &&
      info.size > 1024 &&
      /\.(html|js|css|json|svg|map|webmanifest)$/.test(actual);
    res.setHeader("Vary", "Accept-Encoding");
    if (compress) res.setHeader("Content-Encoding", "gzip");
    else res.setHeader("Content-Length", info.size);
    res.writeHead(200);
    if (req.method === "HEAD") return res.end();
    const stream = createReadStream(actual);
    if (compress) await pipeline(stream, createGzip(), res);
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
