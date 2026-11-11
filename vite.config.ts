import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import manifest from "./app/manifest";
import tsconfig from "./tsconfig.json";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const version =
    process.env.VITE_APP_VERSION ?? (mode === "development" ? "development" : randomUUID());
  // Only this allowlist enters the browser; server/CI secrets are never injected.
  // Legacy names keep the existing VPS .env files usable during migration.
  const publicEnv = {
    VITE_API_URL: env.VITE_API_URL ?? env.NEXT_PUBLIC_URL_API ?? "http://localhost:4000/api/v1",
    VITE_API_ORIGIN: env.VITE_API_ORIGIN ?? env.NEXT_PUBLIC_URL_API_RAW ?? "http://localhost:4000",
    VITE_APP_KEY: env.VITE_APP_KEY ?? env.NEXT_PUBLIC_APP_KEY ?? "",
    VITE_APP_VERSION: version,
    VITE_OPENOBSERVE_SITE: env.VITE_OPENOBSERVE_SITE ?? env.NEXT_PUBLIC_OPENOBSERVE_SITE ?? "",
    VITE_OPENOBSERVE_CLIENT_TOKEN:
      env.VITE_OPENOBSERVE_CLIENT_TOKEN ?? env.NEXT_PUBLIC_OPENOBSERVE_CLIENT_TOKEN ?? "",
    VITE_OPENOBSERVE_ORG: env.VITE_OPENOBSERVE_ORG ?? env.NEXT_PUBLIC_OPENOBSERVE_ORG ?? "default",
  };
  return {
    envPrefix: [],
    plugins: lazyPlugins(() => [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      {
        name: "app-metadata",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.headers["next-action"] !== undefined) {
              res.statusCode = 400;
              res.end();
              return;
            }
            const pathname = req.url?.split("?")[0];
            const body =
              pathname === "/manifest.webmanifest"
                ? manifest()
                : ["/deployment-version.json", "/api/deployment-version"].includes(pathname ?? "")
                  ? { version }
                  : null;
            if (!body) return next();
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            res.end(JSON.stringify(body));
          });
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "manifest.webmanifest",
            source: JSON.stringify(manifest()),
          });
          this.emitFile({
            type: "asset",
            fileName: "deployment-version.json",
            source: JSON.stringify({ version }),
          });
        },
      },
    ]),
    define: Object.fromEntries(
      Object.entries(publicEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    resolve: {
      alias: [
        {
          find: "highcharts/es-modules/masters/highcharts.src.js",
          replacement: fileURLToPath(
            new URL("./node_modules/highcharts/esm/highcharts.src.js", import.meta.url),
          ),
        },
        ...Object.entries(tsconfig.compilerOptions.paths).map(([key, values]) => ({
          find: key.replace(/\/\*$/, ""),
          replacement: fileURLToPath(new URL(values[0].replace(/\/\*$/, ""), import.meta.url)),
        })),
      ],
    },
    build: {
      outDir: process.env.VITE_BUILD_OUT_DIR ?? "dist",
      target: "es2022",
      // "hidden": genera los .map sin el comentario sourceMappingURL en el JS.
      // El deploy los sube a OpenObserve (stack traces legibles en RUM) y los
      // saca de dist: antes se publicaban con todo el código fuente.
      sourcemap: "hidden",
    },
    test: { include: ["e2e/unit/**/*.spec.ts"], environment: "node" },
    lint: {
      plugins: ["typescript", "react", "jsx-a11y"],
      options: { typeAware: true, typeCheck: true },
      ignorePatterns: [
        "dist/**",
        "dist.*/**",
        "coverage/**",
        "playwright-report/**",
        "test-results/**",
        "pnpm-lock.yaml",
        ".agents/**",
        ".claude/**",
        "AGENTS.md",
      ],
      rules: { "react-hooks/rules-of-hooks": "error", "react-hooks/exhaustive-deps": "warn" },
    },
    fmt: {
      ignorePatterns: [
        "dist/**",
        "dist.*/**",
        "coverage/**",
        "playwright-report/**",
        "test-results/**",
        "pnpm-lock.yaml",
        ".agents/**",
        ".claude/**",
        "AGENTS.md",
      ],
    },
  };
});
