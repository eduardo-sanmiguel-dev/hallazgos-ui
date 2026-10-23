module.exports = {
  apps: [
    {
      name: "ui-comp", // Nombre en pm2 (corto: los logs lo recortan a 10 caracteres)
      script: "node_modules/next/dist/bin/next", // Script de Next.js
      args: "start -p 3000", // Comando para producción
      cwd: "./", // Directorio raíz del proyecto
      instances: 1, // Usa una sola instancia en modo fork
      exec_mode: "fork", // Modo de ejecución (fork o cluster)
      env: {
        NODE_ENV: "production", // Variables de entorno
        PORT: 3000,
      },
      watch: false, // No observar cambios en producción
      max_memory_restart: '5G', // Reinicia si excede 5GB de RAM
      out_file: "./logs/out.log", // Log de salida
      error_file: "./logs/error.log", // Log de errores
      merge_logs: true, // Unificar logs
      time: true, // Timestamp en logs
      log_date_format: "DD/MM/YYYY HH:mm", // Formato de ese timestamp
    },
  ],
};
