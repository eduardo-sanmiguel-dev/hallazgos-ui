import { existsSync, readFileSync } from "fs";
import { join } from "path";

/** Carga e2e/.env.e2e (credenciales del usuario de pruebas) en process.env. */
export const loadE2EEnv = () => {
  const file = join(__dirname, "..", ".env.e2e");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
};

export const e2eCredentials = () => {
  loadE2EEnv();
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Faltan E2E_EMAIL / E2E_PASSWORD: copia e2e/.env.e2e.example a e2e/.env.e2e (ver e2e/README.md).",
    );
  }

  return { email, password };
};
