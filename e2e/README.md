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
- `scroll-top.spec.ts`: botón "Volver arriba" en todo el sistema (aparece al
  bajar, no en formularios, por encima de la barra inferior en celular).
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

`pnpm test` ejecuta las pruebas unitarias (`e2e/unit`) con Vitest mediante Vite+,
sin API ni navegador. `pnpm test:e2e` ejecuta las pruebas de navegador con Playwright.

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

Corren en paralelo con **6 workers** por omisión, también en el hook del push.
En el equipo local de 16 hilos, las 449 pruebas pasaron en unos 2 min 32 s,
frente a aproximadamente 3 min 42 s con tres workers (una medición local).

`E2E_WORKERS` permite ajustar la concurrencia; usar 3 para reducir carga o 1
para depurar. En PowerShell, por ejemplo:

```powershell
$env:E2E_WORKERS = "3"
pnpm test:e2e
Remove-Item Env:E2E_WORKERS
```

La misma variable se aplica al ejecutar `git push`.

## Coverage

`test:e2e:coverage` graba el coverage JS del navegador en cada prueba (V8) y
lo lleva a los `.tsx` de `app/` con los source maps del build. Los
archivos que ninguna prueba cargó cuentan con 0%. Quedan fuera las
interfaces (solo tipos) y el generador estático `app/manifest.ts`. La configuración está en
`e2e/support/coverage.ts`.

- `coverage/index.html`: reporte navegable por archivo.
- `coverage/lcov.info`: para VS Code (Coverage Gutters) o CI.

Tanto E2E como cobertura compilan primero en `dist.e2e` usando `.env.development` y levanta su
propio servidor estático en `http://localhost:3000`. No usa `dist` de producción,
ni depende de una terminal con `pnpm dev`, HMR o recompilaciones durante la suite.
Playwright cierra su servidor al terminar, incluso si falla una prueba.

Antes de ejecutar E2E o hacer un push, detén `pnpm dev` para dejar libre el puerto 3000:
la API permite ese origen para CORS y WebSocket. Si el puerto está ocupado,
Playwright falla al inicio en lugar de reutilizar silenciosamente otro proceso.
La API debe permanecer levantada durante toda la ejecución.

Ambos comandos usan el mismo servidor aislado y el Chrome instalado (no descargan navegadores).
El timeout de la respuesta del login empieza después de cargar y rellenar el formulario,
inmediatamente antes del clic; el arranque de la UI no consume ese tiempo.

Si restauras o migras la base de desarrollo, reinicia la API para recrear el usuario
E2E. El setup informa el estado HTTP si la autenticación falla y cierra Chrome al salir.
