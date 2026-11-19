# AGENTS.md — hallazgos-ui

Reglas para cambiar código sin romper lo que no se ve a simple vista. Cómo
levantar, variables y despliegue: `README.md`; pruebas: `e2e/README.md`.

## Qué es

SPA de ComportArte (HADA): seguridad industrial en plantas de México y
Colombia. Consume [hallazgos-api](../hallazgos-api), que es **la autoridad de
permisos**; la UI solo muestra u oculta acciones. Se usa mucho en celular
dentro de planta (cámara, señal débil, modo oscuro).

Vocabulario: _hallazgo_ = `evidence`, _planta_ = `manufacturingPlant`. Código
en inglés, **todo texto visible en español**.

## Stack: lo que cambia cómo se escribe el código

- **React 19 con React Compiler**: no agregar `useMemo`/`useCallback` solo por
  rendimiento; las reglas de hooks son error en Oxlint.
- **Vite+** (Vite, Oxlint, Oxfmt, Vitest) vía `scripts/toolchain.mjs`; no
  llamar a `vp` directamente.
- **No es Next.js**, aunque queden nombres de esa época (`page.tsx`); las
  skills de Next no aplican.
- React Router 7, MUI 9, TanStack Query 5, Zustand 5, axios, dayjs. **pnpm 12**.

## Dónde mirar

- **Las rutas salen de las carpetas**: `app/features/zones/form/page.tsx` →
  `/zones/form`. Nunca poner un `page.tsx` dentro de `_components/` o `_lib/`:
  se volvería ruta.
- **Ejemplo canónico: `app/features/zones/`** (lista con filtros, orden y
  paginación) y `zones/form/page.tsx` (alta y edición con `useEditRecord`).
- Usar los alias de `tsconfig.json` (`@services`, `@interfaces`, `@hooks`,
  `@store`, `@shared/*`…) en lugar de rutas relativas largas.
- `app/_interfaces/` se mantiene a mano: si la API cambia una respuesta, se
  cambia aquí.

## Reglas que no se deben romper

1. **Toda llamada a la API pasa por un servicio de `app/_services/`** sobre
   `axiosWrapper`, que ya muestra los errores según `code`, agrupa fallos,
   ofrece "Reintentar" sin conexión y avisa cuando la sesión terminó. No usar
   `fetch`/`axios` sueltos ni duplicar esos avisos.
2. **Errores: decidir por `code`, nunca por el texto** (`parseApiError`). En
   formularios, `useFieldErrors` marca los campos que devuelve la API.
3. **Envíos que crean registros o mandan correos llevan `Idempotency-Key`**
   con `useIdempotencyKey`. Los formularios largos (hallazgos, ICS, Gemba
   Walk) guardan borrador local con `useFormDraft`.
4. **Catálogos con TanStack Query:** llaves en `@shared/libs/catalogKeys`,
   hooks en `useCatalogs`, y las mutaciones envueltas con
   `withCatalogInvalidation(fn, "nombre")`. Listados: `usePaginatedList` +
   `useTableSort`.
5. **La API responde 400 a campos de más**: mandar exactamente lo que acepta su
   DTO. `orderBy` solo admite columnas de su lista blanca.
6. **Acceso a páginas = menú.** `RouteAccessGuard` permite una ruta solo si su
   opción de `app/_shared/components/menu.tsx` es visible. Una pantalla nueva
   se agrega al menú con su `visible` (p. ej. `adminOnly`), o mostrará "sin
   acceso".
7. **Navegación con `@shared/navigation`** y `AppLink`, no con
   `react-router-dom` directo. Las imágenes de evidencias exigen sesión: usar
   `AppImage`.
8. **Colores de la paleta de MUI** (`semanticTones.ts`, `app/theme.tsx`),
   nunca fijos: hay tema claro y oscuro con contraste AA.
9. **Las variables `VITE_*` son públicas** y solo entran las de la lista de
   `vite.config.ts`. Ningún secreto en la UI.
10. **Acciones RUM:** los botones relevantes llevan `data-dd-action-name` con
    un nombre estable en español, sin ids, valores ni nombres de personas.
11. **Fechas:** dayjs desde `@shared/libs/dayjs` y formatos de
    `@shared/utils/dates`. Las descargas que arma la API reciben
    `timeZone: getBrowserTimeZone()`; una descarga nueva con fechas debe
    mandarlo también.
12. **No crear `loading.tsx` ni `error.tsx` al estilo Next**: el router solo
    registra `page.tsx`. Dentro de una pantalla se usan `Skeletons`,
    `EmptyState` y `ErrorState`.

**Pantalla nueva:** `page.tsx` → `_components/` → servicio (exportado en
`_services/index.ts`) e interfaz → entrada en `menu.tsx` → prueba e2e.

## Pruebas: obligatorias en cada cambio

- **Unitarias** (Vitest, `e2e/unit/*.spec.ts`): lógica pura. `pnpm test`.
- **E2E** (Playwright): contra la **API local real** en `localhost:4000`, con
  servidor propio en el puerto 3000 (debe estar libre). **No escriben datos**:
  las escrituras se interceptan con `captureWrites` (`e2e/support/api.ts`) y se
  valida lo que se habría enviado.
- **Cobertura** (`pnpm test:e2e:coverage`): pisos en `e2e/global-teardown.ts`.
  Una prueba que termina en recarga completa pierde la cobertura de esa página.
- Trampas que han hecho "pasar" pruebas sin probar nada: los selectores de
  filtro se limpian con Escape, y un diálogo de MUI abierto oculta la página a
  `getByRole`.

## Antes de dar algo por terminado

```bash
pnpm check          # formato, Oxlint y tipos
pnpm test           # unitarias
pnpm test:e2e       # requiere la API en modo dev y el puerto 3000 libre
```

## Cuidado

- **Un push a `main` despliega a producción.** No hacer commit ni push si no lo
  piden.
- No leer ni modificar `.env.*` reales ni `e2e/.env.e2e`.
- Las skills de `.claude/skills` y `.agents/skills` son genéricas; este archivo
  manda sobre ellas.
