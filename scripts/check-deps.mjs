// Verifica que node_modules corresponda a package.json antes de compilar.
// Si falta una dependencia (o quedó otra versión) el build fallaría a mitad
// con "Module not found"; aquí se detiene antes con un mensaje claro.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const { dependencies = {} } = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);

const EXACT_VERSION = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
const problems = [];

for (const [name, spec] of Object.entries(dependencies)) {
  let installed;
  try {
    installed = JSON.parse(
      readFileSync(join(root, "node_modules", name, "package.json"), "utf8"),
    ).version;
  } catch {
    problems.push(`${name}: no instalado`);
    continue;
  }

  if (EXACT_VERSION.test(spec) && installed !== spec) {
    problems.push(`${name}: instalado ${installed}, se esperaba ${spec}`);
  }
}

if (problems.length) {
  console.error(
    "\nnode_modules no corresponde a package.json:\n" +
      problems.map((problem) => `  - ${problem}`).join("\n") +
      "\n\nEjecuta `pnpm install --frozen-lockfile` antes de compilar.\n",
  );
  process.exit(1);
}

console.log(`Dependencias verificadas (${Object.keys(dependencies).length}).`);
