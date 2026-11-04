import { relative, resolve } from "node:path";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const processInfo = JSON.parse(input).find((entry) => entry.name === "ui-comp");
const apps = [];
if (processInfo) {
  const current = processInfo.pm2_env;
  const relocate = process.argv[2];
  const relocatePath = (path) =>
    relocate && path?.startsWith(`${current.pm_cwd}/`)
      ? resolve(relocate, relative(current.pm_cwd, path))
      : path;
  const env = {};
  for (const key of [
    "NODE_ENV",
    "PORT",
    "HOST",
    "UI_DIST_DIR",
    "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
  ]) {
    if (current[key] !== undefined) env[key] = current[key];
  }
  apps.push({
    name: "ui-comp",
    namespace: current.namespace,
    script: relocatePath(current.pm_exec_path),
    args: current.args ?? [],
    cwd: relocate || current.pm_cwd,
    interpreter: current.exec_interpreter,
    exec_mode: "fork",
    instances: 1,
    env,
    max_memory_restart: current.max_memory_restart,
    out_file: current.pm_out_log_path,
    error_file: current.pm_err_log_path,
    merge_logs: true,
    log_date_format: current.log_date_format,
  });
}
process.stdout.write(JSON.stringify({ apps }));
