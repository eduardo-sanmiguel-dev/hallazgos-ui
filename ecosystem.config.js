module.exports = {
  apps: [
    {
      name: "ui-comp",
      namespace: "comportarte",
      script: "scripts/serve.mjs",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: 3000 },
      watch: false,
      max_memory_restart: "512M",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      log_date_format: "DD/MM/YYYY HH:mm",
    },
  ],
};
