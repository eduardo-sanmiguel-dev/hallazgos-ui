import { expect, test } from "vite-plus/test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

function snapshot(processes: unknown[], relocate?: string) {
  const result = spawnSync(
    process.execPath,
    ["scripts/pm2-ui-snapshot.mjs", ...(relocate ? [relocate] : [])],
    { input: JSON.stringify(processes), encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}
const ui = {
  name: "ui-comp",
  pm2_env: {
    namespace: "comportarte",
    pm_cwd: "/home/eduardo/hallazgos-ui",
    pm_exec_path: "/home/eduardo/hallazgos-ui/node_modules/next/dist/bin/next",
    args: ["start", "-p", "3000"],
    exec_interpreter: "/usr/bin/node",
    NODE_ENV: "production",
    PORT: 3000,
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "old-next-test-key",
    DATABASE_PASSWORD: "must-not-be-copied",
  },
};
test("el rollback relocaliza Next al respaldo y conserva sus argumentos", () => {
  const backup = resolve("backup/app");
  const { apps } = snapshot([ui], backup);
  expect(apps[0]).toMatchObject({
    name: "ui-comp",
    namespace: "comportarte",
    cwd: backup,
    script: resolve(backup, "node_modules/next/dist/bin/next"),
    args: ["start", "-p", "3000"],
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "old-next-test-key",
    },
  });
});
test("la recuperación incluye solo la UI y las variables necesarias", () => {
  const { apps } = snapshot([{ name: "api-comp", pm2_env: { DATABASE_PASSWORD: "private" } }, ui]);
  expect(apps).toHaveLength(1);
  expect(apps[0].script).toBe(ui.pm2_env.pm_exec_path);
  expect(apps[0].env).toEqual({
    NODE_ENV: "production",
    PORT: 3000,
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "old-next-test-key",
  });
  expect(JSON.stringify(apps)).not.toContain("must-not-be-copied");
});
test("una instalación sin UI previa produce una configuración vacía", () => {
  expect(snapshot([])).toEqual({ apps: [] });
});
