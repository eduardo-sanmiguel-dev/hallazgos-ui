# ComportArte UI

Aplicación React 19 + TypeScript con Vite+ (Oxc y Rolldown), React Router,
React Compiler estable mediante Babel, MUI, TanStack Query y Zustand.
NestJS sigue siendo la autoridad para autenticación y permisos.

## Desarrollo

Node ^22.18, ^24.11 o >=26 y pnpm 12.16.1.
`pnpm install --frozen-lockfile`, luego `pnpm dev` (http://localhost:3000).
La API local debe estar en http://localhost:4000 con su base de desarrollo.
Abrir la UI en `http://localhost:3000`: `127.0.0.1:3000` es otro origen
y la API lo rechaza tanto en CORS como en el WebSocket de actualizaciones.
Copiar `.env.example` a `.env.development` y configurar la clave pública del API.
Los nombres anteriores NEXT_PUBLIC_URL_API, NEXT_PUBLIC_URL_API_RAW y
NEXT_PUBLIC_APP_KEY se aceptan como respaldo para conservar los .env existentes.
Solo se incorpora al navegador la lista explícita de variables públicas.

## Comandos

- `pnpm check`: formato, Oxlint y tipos (TypeScript Go).
- `pnpm typecheck` / `pnpm typecheck:ts6`: verificación de tipos independiente.
- `pnpm lint`: Oxlint, incluidas reglas de React y hooks.
- `pnpm format`: Oxfmt; `pnpm format:check`: solo comprobar.
- `pnpm test`: pruebas unitarias con Vitest mediante Vite+.
- `pnpm test:e2e`: pruebas completas en Chrome con la API de desarrollo.
- `pnpm test:e2e:coverage`: cobertura de la aplicación durante los e2e.
- `pnpm build`: dependencias, tipos y build de producción en `dist/`.
- `pnpm start`: servir `dist/` en el puerto 3000; admite PORT y HOST.

Los scripts pasan por `scripts/toolchain.mjs`, que ejecuta las herramientas exactas
incluidas en Vite+ y lee su configuración central. Evita un bloqueo observado
del despachador nativo `vp` en Windows con Node 26. No utiliza la caché de tareas
del despachador; no cambia el compilador, bundler ni las versiones de herramientas.
Los archivos de configuración generados para Oxlint/Oxfmt están ignorados por Git.

## Organización

`app/features/` conserva cada módulo y sus rutas originales (page.tsx).
`app/router/` registra los módulos con carga diferida y verifica sesión.
`app/_shared/navigation.ts` centraliza la navegación; AppLink conserva enlaces
reales y AppImage conserva imágenes originales, blobs y firmas.
Los componentes compartidos, servicios, borradores e interfaces mantienen sus APIs.
React Compiler se aplica a componentes y hooks; no se habilita el port Rust experimental.

## Sesión y permisos

Las cookies HttpOnly se envían con credentials. El router valida la identidad
contra la API y restaura el usuario en el store antes de mostrar rutas protegidas.
Se conservan `?next=`, recuperación de contraseña, controles de acceso por rol
y usuario, aviso de sesión terminada y borradores locales. La caché se limpia
al cambiar de cuenta. La autorización real se comprueba siempre en NestJS.

## Producción

Configurar `.env.production` antes de compilar. Es una SPA estática:
Nginx puede servir `dist/` directamente con fallback a index.html para las rutas,
sin aplicar ese fallback a los assets. Ver `deploy/nginx.conf.example`.
Se incluye `scripts/serve.mjs` para mantener el puerto 3000 y el proceso PM2
`ui-comp` sin exigir cambios inmediatos al reverse proxy.

El build genera un ID único en el bundle y `dist/deployment-version.json`.
Se conservan eventos WebSocket ui-version/api-version, verificación previa a
recargar y publicación atómica con `scripts/publish-ui-version.mjs`.
El servidor también conserva `/api/deployment-version` para pestañas anteriores.

El script de despliegue prepara `dist.next`, conserva `dist.prev` y cambia el
proceso a `ecosystem.config.js` después de compilar. En el primer despliegue
desde Next, revisar que el script del VPS invoque esta versión del script y que
PM2 adopte `scripts/serve.mjs`. Para volver a Next hay que restaurar el commit,
instalar su lockfile, compilar y arrancar su configuración PM2; un dist no es
intercambiable con un build .next. Esta migración local no despliega ni modifica el VPS.

## Validación

Ver `docs/migracion-vite-plus.md` y `e2e/README.md`. Las escrituras de los e2e
se interceptan, mientras que autenticación y lecturas utilizan la API local.
La prueba aislada de actualizaciones sigue disponible con
`pnpm exec playwright test -c playwright.deployment.config.ts`.
