import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolveConfig } from "vite-plus";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

// Use the exact tools bundled with Vite+. The native vp dispatcher hangs in
// this Windows/Node 26 environment; direct Node entrypoints also work in CI.
const bundled = createRequire(import.meta.resolve("vite-plus/package.json"));
function packageBin(name, executable) {
  const metadata = bundled.resolve(`${name}/package.json`);
  const { bin } = JSON.parse(readFileSync(metadata, "utf8"));
  return join(dirname(metadata), typeof bin === "string" ? bin : bin[executable]);
}
let toolConfig;
if (["lint", "fmt", "check"].includes(process.argv[2])) {
  process.env.VP_RESOLVING_CONFIG_METADATA = "1";
  toolConfig = await resolveConfig({}, "build");
}
function run(command, args = []) {
  let entry;
  let forwarded = args;
  const env = { ...process.env };
  if (["dev", "build", "preview"].includes(command)) {
    const coreDist = dirname(dirname(bundled.resolve("vite")));
    entry = join(coreDist, "bin/vite.js");
    if (command !== "dev") forwarded = [command, ...args];
  } else if (command === "test") {
    entry = packageBin("vitest", "vitest");
  } else if (command === "lint" || command === "fmt") {
    env.VP_COMMAND = command;
    env.VP_RESOLVING_CONFIG_METADATA = "1";
    const { options, ...config } = toolConfig[command] ?? {};
    const configPath = `.ox${command === "lint" ? "lint" : "fmt"}.generated.json`;
    writeFileSync(configPath, JSON.stringify(config));
    forwarded = ["--config", configPath, ...args];
    if (command === "lint") {
      if (options?.typeAware) forwarded.push("--type-aware");
      if (options?.typeCheck) forwarded.push("--type-check");
    }
    entry = packageBin(
      command === "lint" ? "oxlint" : "oxfmt",
      command === "lint" ? "oxlint" : "oxfmt",
    );
    if (command === "lint") {
      const helper = createRequire(bundled.resolve("oxlint-tsgolint/bin/tsgolint"));
      env.OXLINT_TSGOLINT_PATH = helper.resolve(
        `@oxlint-tsgolint/${process.platform}-${process.arch}/tsgolint${process.platform === "win32" ? ".exe" : ""}`,
      );
    }
  } else {
    throw new Error(`Comando de herramientas desconocido: ${command}`);
  }
  const result = spawnSync(process.execPath, [entry, ...forwarded], { stdio: "inherit", env });
  if (result.error) throw result.error;
  return result.status ?? 1;
}
const [command, ...args] = process.argv.slice(2);
if (command === "check") {
  const formatted = run("fmt", ["--check"]);
  process.exit(formatted || run("lint"));
}
process.exit(run(command, args));
