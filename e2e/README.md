# Pruebas e2e (Playwright)

Prueban el UI completo contra el API local y la base de **desarrollo**.
No crean ni modifican registros: el alta de hallazgos se intercepta en el
navegador y se valida lo que se habría enviado.

## Qué cubren

- `auth.spec.ts`: ruta protegida sin sesión, validación del formulario,
  contraseña incorrecta, inicio y cierre de sesión.
- `hallazgos.spec.ts`: lista con filtro por planta y alta de un hallazgo con
  evidencia (sin guardar).
- `exports.spec.ts`: Excel de hallazgos y de CIAEL; el PDF de hallazgos exige
  planta.
- `smoke.spec.ts`: las pantallas principales cargan sin errores.

## Preparación (una vez)

1. Copiar `e2e/.env.e2e.example` a `e2e/.env.e2e` y poner una contraseña
   aleatoria de 16+ caracteres en `E2E_PASSWORD`.
2. Crear el usuario de pruebas en la base de desarrollo (rol Administrador,
   todas las plantas). El script se niega a correr si la base no es local:

   ```bash
   cd ../hallazgos-api
   set -a && . ../hallazgos-ui/e2e/.env.e2e && set +a
   node scripts/e2e-user/run.js
   ```

## Ejecutar

Con el API corriendo (`pnpm start:dev` en hallazgos-api):

```bash
pnpm test:e2e          # todas
pnpm test:e2e:ui       # modo interactivo
pnpm test:e2e:report   # reporte HTML de la última corrida
```

El UI se levanta solo con `pnpm dev` si no está corriendo. Usa el Chrome
instalado en el equipo (no descarga navegadores).
