import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Coverage owns its server: a dev terminal or HMR restart cannot interrupt it.
const url = new URL(process.env.E2E_BASE_URL || "http://localhost:3000");
if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
  throw new Error("El servidor de cobertura requiere una URL HTTP local en E2E_BASE_URL.");
}
const build = spawnSync(
  process.execPath,
  ["scripts/build.mjs", "--mode", "development", "--outDir", "dist.e2e"],
  { stdio: "inherit" },
);
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

// Development API configuration, production bundling, and source maps for V8.
// dist and its production environment are never served by this command.
process.env.UI_DIST_DIR = fileURLToPath(new URL("../dist.e2e", import.meta.url));
process.env.PORT = url.port || "80";
process.env.HOST = url.hostname.replace(/^\[|\]$/g, "");
await import("./serve.mjs");
