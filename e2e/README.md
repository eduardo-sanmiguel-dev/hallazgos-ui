# Pruebas e2e (Playwright)

Prueban el UI completo contra el API local y la base de **desarrollo**.
No crean ni modifican registros: las altas y ediciones se interceptan en el
navegador (`captureWrites` en `support/api.ts`) y se valida lo que se habría
enviado. Las pantallas que dependen de lo programado para hoy (Gemba Walk)
leen datos fijos con `mockGet`.

## Qué cubren

- `auth.spec.ts`: ruta protegida sin sesión, validación del formulario,
  contraseña incorrecta, inicio y cierre de sesión.
- `hallazgos.spec.ts`: lista con filtro por planta y alta de un hallazgo con
  evidencia (sin guardar).
- `exports.spec.ts`: Excel de hallazgos y de CIAEL; el PDF de hallazgos exige
  planta.
- `smoke.spec.ts`: las pantallas principales cargan sin errores.
- `catalogs.spec.ts`: alta y edición (desde la tabla) de criterios, tipos de
  criterio, procesos, lugares, zonas y plantas; validaciones de requeridos.
- `people.spec.ts`: usuarios (supervisor con zonas, general, contraseña),
  colaboradores (fechas) y equipos de emergencia.
- `gemba-walk.spec.ts`: registrar un recorrido (inicio, NC, confirmación),
  tolerancia vencida, acceso de no observadores, detalle, agenda, programación
  del calendario y catálogos (zonas, conceptos, observadores).

## Preparación (una vez)

1. Copiar `e2e/.env.e2e.example` a `e2e/.env.e2e` y poner una contraseña
   aleatoria de 16+ caracteres en `E2E_PASSWORD`.
2. Copiar las mismas `E2E_EMAIL` y `E2E_PASSWORD` al `.env.development` de
   hallazgos-api. Al levantar la API en desarrollo (`pnpm start:dev`) el
   usuario se crea solo si no existe (rol Administrador, todas las plantas),
   y si existe se le corrigen contraseña, rol y plantas. Solo ocurre con
   `NODE_ENV=development` y base local (`E2eUserSeedService`); útil tras
   restaurar la base desde producción.

   Para crearlo sin levantar la API:

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
pnpm test:e2e:coverage # todas, midiendo coverage (reporte en coverage/)
```

Antes de cada `git push`, el hook `.husky/pre-push` corre typecheck, lint y
estas pruebas; si algo falla, no se sube. Necesita el API levantado. En una
emergencia: `git push --no-verify`.

Corren en paralelo con 3 workers. Si el API o el dev server se saturan,
`E2E_WORKERS=1 pnpm test:e2e` las corre una a la vez (en Windows con Git
Bash, `npx cross-env E2E_WORKERS=1 pnpm test:e2e`).

## Coverage

`test:e2e:coverage` graba el coverage JS del navegador en cada prueba (V8) y
lo lleva a los `.tsx` de `app/` con los source maps del dev server. Los
archivos que ninguna prueba cargó cuentan con 0%. Quedan fuera las
interfaces (solo tipos) y lo que corre solo en el servidor (`app/layout.tsx`,
`manifest.ts`, `not-found.tsx`, `privacy/page.tsx`). La configuración está en
`e2e/support/coverage.ts`.

- `coverage/index.html`: reporte navegable por archivo.
- `coverage/lcov.info`: para VS Code (Coverage Gutters) o CI.

Si el UI ya está corriendo, se reutiliza; debe ser `pnpm dev` (sin source
maps no hay forma de llevar el coverage a los `.tsx`).

El UI se levanta solo con `pnpm dev` si no está corriendo. Usa el Chrome
instalado en el equipo (no descarga navegadores).
