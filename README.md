# ComportArte UI

Interfaz web de ComportArte (HADA): hallazgos de seguridad, EPP, inspección de
extintores, Gemba Walk, CIAEL, colaboradores, catálogos y dashboards. Consume
[hallazgos-api](../hallazgos-api), que es la autoridad de autenticación y permisos.

- **React 19 + TypeScript** con Vite+ (Oxc y Rolldown) y React Compiler estable vía Babel.
- **React Router** con carga diferida, **MUI**, **TanStack Query** y **Zustand**.
- **SPA estática**: en producción la sirve `scripts/serve.mjs` en PM2 (`ui-comp`).
- **RUM de OpenObserve** para sesiones, errores y rendimiento, solo en producción.

## Desarrollo

Requisitos: Node `^22.18`, `^24.11` o `>=26` y **pnpm 12.16.1** (`packageManager`).

```bash
pnpm install --frozen-lockfile
cp .env.example .env.development   # VITE_APP_KEY = APP_KEY de la API
pnpm dev                           # http://localhost:3000
```

- La API local debe estar en `http://localhost:4000` con su base de desarrollo.
- Abrir la UI en `http://localhost:3000`: `127.0.0.1:3000` es otro origen y la
  API lo rechaza en CORS y en el WebSocket de actualizaciones.

## Variables de entorno

**Todas las `VITE_*` son públicas:** se incrustan en el JavaScript que descarga
cualquier visitante. Nunca poner ahí secretos ni claves privadas. Solo se
incorpora al navegador la lista explícita de `vite.config.ts`.

| Variable                        | Para qué                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `VITE_API_URL`                  | Base de la API y de su WebSocket de versiones (`http://localhost:4000/api/v1`). |
| `VITE_API_ORIGIN`               | Origen de la API: imágenes de evidencias y trazas enlazadas en RUM.             |
| `VITE_APP_KEY`                  | Cabecera `x-app-key`; debe coincidir con `APP_KEY` de la API.                   |
| `VITE_OPENOBSERVE_SITE`         | Servidor de OpenObserve para RUM (vacío = sin monitoreo).                       |
| `VITE_OPENOBSERVE_CLIENT_TOKEN` | Token **público** de ingesta de RUM (no es una credencial de administración).   |
| `VITE_OPENOBSERVE_ORG`          | Organización de OpenObserve (`default`).                                        |

`VITE_APP_VERSION` lo genera el build; no se define a mano. Los nombres
anteriores `NEXT_PUBLIC_URL_API`, `NEXT_PUBLIC_URL_API_RAW` y
`NEXT_PUBLIC_APP_KEY` se aceptan como respaldo para `.env` existentes.

Variables del entorno de ejecución (no van en `.env`):

- `scripts/serve.mjs`: `PORT` (3000), `HOST` (127.0.0.1) y `UI_DIST_DIR` (`dist`).
- Pruebas e2e: `E2E_BASE_URL` y `E2E_WORKERS` (ver `e2e/README.md`).

## Comandos

- `pnpm check`: formato, Oxlint y tipos (TypeScript Go).
- `pnpm typecheck` / `pnpm typecheck:ts6`: verificación de tipos independiente.
- `pnpm lint`: Oxlint, incluidas reglas de React y hooks.
- `pnpm format`: Oxfmt; `pnpm format:check`: solo comprobar.
- `pnpm test`: pruebas unitarias con Vitest (`e2e/unit/`).
- `pnpm test:e2e`: pruebas completas en Chrome con la API de desarrollo y servidor propio.
  Detener `pnpm dev` para dejar libre el puerto 3000, también antes de un push.
- `pnpm test:e2e:coverage`: build de pruebas, servidor propio y cobertura de los e2e.
- `pnpm build`: dependencias, tipos y build de producción en `dist/`.
- `pnpm start`: servir `dist/` en el puerto 3000.

Los scripts pasan por `scripts/toolchain.mjs`, que ejecuta las herramientas exactas
incluidas en Vite+ y lee su configuración central. Evita un bloqueo observado
del despachador nativo `vp` en Windows con Node 26. No utiliza la caché de tareas
del despachador; no cambia el compilador, bundler ni las versiones de herramientas.
Los archivos de configuración generados para Oxlint/Oxfmt están ignorados por Git.

**Hook de `git push`:** corre typecheck, lint, pruebas unitarias y los e2e
completos. Necesita la API local en `http://localhost:4000` y el puerto 3000 libre.

## Organización

- `app/features/`: un módulo por pantalla, con sus rutas originales (`page.tsx`).
- `app/router/`: registra los módulos con carga diferida y verifica la sesión.
- `app/_services/`, `app/_interfaces/`, `app/_store/`: llamadas a la API, tipos y estado global.
- `app/_shared/`: componentes, utilidades y constantes compartidas.
  `navigation.ts` centraliza la navegación; AppLink conserva enlaces reales y
  AppImage conserva imágenes originales, blobs y firmas.
- `e2e/`: pruebas Playwright; `e2e/unit/`: pruebas unitarias.

React Compiler se aplica a componentes y hooks; no se habilita el port Rust experimental.

## Sesión y permisos

Las cookies HttpOnly se envían con credentials. El router valida la identidad
contra la API y restaura el usuario en el store antes de mostrar rutas protegidas.
Se conservan `?next=`, recuperación de contraseña, controles de acceso por rol
y usuario, aviso de sesión terminada y borradores locales. La caché se limpia
al cambiar de cuenta.

La API envía con el usuario sus permisos especiales ya calculados
(`evidencePermissions`); la UI los usa solo para mostrar u ocultar acciones.
La autorización real se comprueba siempre en NestJS.

## Monitoreo (RUM)

Solo en producción, con `VITE_OPENOBSERVE_*` configuradas y fuera de bots y localhost
(`app/observability.ts`):

- Sesiones con grabación, errores, acciones, recursos y Web Vitals.
- Cada sesión se identifica con el usuario, su **rol** y sus **plantas**
  (`usr_role`, `usr_plants`), y con la planta que está viendo
  (`context_selected_plant`). El nombre se envía como "Nombre · Rol · Planta"
  para verlo en la lista de Sesiones de OpenObserve, que tiene columnas fijas.
- Las llamadas a la API se enlazan con sus trazas del servidor.

**Source maps:** el build los genera ocultos (`sourcemap: "hidden"`) y **nunca se
publican**: `scripts/serve.mjs` responde 404 a cualquier `.map`. El deploy los
sube a OpenObserve para que los errores de RUM muestren el código original, y
conserva en OpenObserve solo las últimas 10 versiones.

## Producción

Configurar `.env.production` antes de compilar. Es una SPA estática: Nginx
puede servir `dist/` con fallback a `index.html` para las rutas, sin aplicarlo a
los assets (ver `deploy/nginx.conf.example`). `scripts/serve.mjs` mantiene el
puerto 3000 y el proceso PM2 `ui-comp` sin exigir cambios al reverse proxy.

El build genera un ID único en el bundle y `dist/deployment-version.json`.
Se conservan los eventos WebSocket `ui-version`/`api-version`, la verificación
previa a recargar y la publicación atómica con `scripts/publish-ui-version.mjs`.
El servidor también conserva `/api/deployment-version` para pestañas anteriores.

### Despliegue

El único camino a producción es **GitHub Actions**: cada push a `main` corre
typecheck, lint, pruebas y build; si pasan, entra por SSH al VPS y ejecuta
`~/scripts/hallazgos-ui.sh`, que sincroniza `main` y llama a
`scripts/deploy-production.sh`. Ese script:

1. Construye una release independiente en `~/hallazgos-ui-releases/` con las
   variables de producción, y verifica formato, lint, tipos, pruebas y build.
2. Saca los source maps de `dist/` a la carpeta privada de la release y los sube
   a OpenObserve. Si la subida falla solo avisa; si quedara un `.map` en `dist`,
   el deploy se detiene.
3. Reemplaza únicamente `ui-comp` y verifica el ID publicado en localhost y por
   HTTPS antes de notificar la versión y guardar PM2.

Un fallo después del cambio restaura la definición PM2 y la versión anterior.
Si el commit ya está desplegado y verificado, el script no hace nada.

Variables opcionales del deploy, en el entorno del VPS: `O2_URL`
(`http://127.0.0.1:5080`), `O2_ORG` (`default`), `O2_SOURCEMAPS_CREDENTIALS_FILE`
(`~/.o2_token`, con `usuario:contraseña`) y `SOURCEMAPS_KEEP` (10).

## Validación

Ver `e2e/README.md`. Las escrituras de los e2e se interceptan, mientras que
autenticación y lecturas usan la API local. La prueba aislada de actualizaciones
sigue disponible con `pnpm exec playwright test -c playwright.deployment.config.ts`.
