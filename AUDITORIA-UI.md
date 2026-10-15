# Auditoría de UI — hallazgos-ui

Rama: `feat/mejora-ui-sistema` · Fecha: 2026-10-14

Skills aplicadas: `frontend-design`, `accessibility`, `vercel-composition-patterns`, `vercel-react-best-practices`, `next-best-practices`, `typescript-advanced-types`.

## 0. Línea base (Fase 0)

| Elemento | Valor |
|---|---|
| Next.js | 16.3.8 (App Router, `proxy.ts` en lugar de middleware) |
| React | 19.3.0 |
| MUI | `@mui/material` 9.4.0, `@mui/icons-material` 9.4.0, `@mui/x-date-pickers` 9.14.0, `@mui/lab` |
| TypeScript | 6.0.3 (typecheck con `typescript7`) |
| Theme | `app/theme.tsx` → `app/ThemeRegistry.tsx` (layout raíz) **y** un segundo theme creado en `app/(routes)/layout.tsx` |
| Layout principal | `app/(routes)/layout.tsx` (AppBar + Drawer + menú) |
| Compartidos | `app/_shared/components`, `app/_components`, `app/_hooks`, `app/_shared/utils` |
| Scripts | `build`, `lint`, `typecheck`, `typecheck:ts6`. **No hay tests.** |

Resultados de la línea base:

| Comando | Resultado |
|---|---|
| `npm run build` | Compila sin errores ni warnings |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Fallaba en cualquier archivo por incompatibilidad con ESLint 10. **Arreglado en `21cea73`** (solo configuración). Línea base: 277 archivos, **0 errores, 2 warnings** (`react-hooks/exhaustive-deps` en `MultiSelectProcesses.tsx:80` y `MultiSelectZones.tsx:78`). |

Inventario: 22 módulos bajo `app/(routes)` y 173 archivos `.tsx` (90 con `"use client"`). Los módulos más grandes son Dashboard (40 archivos, ~9 800 líneas), Gemba Walk (25, ~4 600), Hallazgos (11, ~3 400) y Guías de entrenamiento (1 archivo de ~1 370 líneas).

## 1. Resumen ejecutivo

1. **Dos themes y uno se recrea en cada render.** `app/(routes)/layout.tsx` crea `lightTheme` y `darkTheme` en cada render, por lo que su `useMemo` nunca reutiliza nada y todo el árbol se vuelve a estilar. Además no hay ningún override de componentes: cada pantalla repite estilos a mano.
2. **Contraste insuficiente en todas las tablas.** El encabezado de `StyledTableCell` es texto blanco sobre `#71BF44` (≈ 2.3:1; AA pide 4.5:1). Afecta a casi todos los módulos.
3. **Highcharts completo y sin minificar en el layout de todas las rutas.** `highcharts/esm/highcharts.src.js` se importa en `app/(routes)/layout.tsx` solo para fijar colores del modo oscuro, así que se descarga incluso en pantallas sin gráficas. Además, cambiar de tema recarga la página en `/dashboard`.
4. **Encabezado de página copiado en 45 archivos.** Todos con `h4` y un color calculado a mano (`mode === "light" ? black : white`) en lugar de `text.primary`.
5. **Botones sin nombre accesible.**
   - 24 botones de "refrescar" son solo ícono, sin texto ni `aria-label`.
   - 44 de 45 `IconButton` no tienen `aria-label`. En HDS, el botón de descargar dice "expand row".
   - 22 `ButtonGroup` tienen `aria-label` en inglés.
6. **Estructura de página no accesible.**
   - `<html lang="en">` en un sistema en español.
   - `<main>` anidado: uno en el layout raíz y otro en el de rutas.
   - El único `h1` es el nombre del usuario en el AppBar.
   - No hay enlace para saltar al contenido.
   - La paginación de tablas está en inglés.
7. **Eliminar es inconsistente.** 7 módulos eliminan sin confirmación (Usuarios, Colaboradores, Plantas, Procesos, Criterios, Tipos de criterios, ICS); el resto usa una confirmación con toast o un `Dialog`.
8. **Formularios sin errores en línea.** La validación solo muestra un toast; no hay `helperText`, `aria-invalid` ni foco en el primer error.
9. **Sin `error.tsx`, `not-found.tsx` ni `loading.tsx`.** Un error de render deja la pantalla en blanco, y si la API no responde, `proxy.ts` devuelve un 404 confuso.
10. **Tipado y código muerto.** Hay 22 `any`, concentrados en `TableDefault`, `SelectDefault` y los `MultiSelect*`. `TableDefault.tsx` arrastra 118 líneas de código comentado.

## 2. Hallazgos por categoría

Riesgo = riesgo de **aplicar** la corrección para la funcionalidad existente.

### 2.1 Diseño y consistencia visual (`frontend-design`)

| # | Hallazgo | Archivo(s) | Riesgo |
|---|---|---|---|
| D1 | Theme sin tokens ni overrides; `#71BF44` fijo en 3 lugares | `app/theme.tsx`, `app/(routes)/layout.tsx` | Bajo |
| D2 | Encabezado de página repetido con color calculado a mano | 45 archivos (`variant="h4"` + `palette.mode === "light"`) | Bajo |
| D3 | Barra de acciones repetida: `Toolbar` + "Crear" + `ButtonGroup` con un refrescar sin texto | ~22 páginas de listado | Bajo |
| D4 | Filtros envueltos en `Paper` uno por uno, con título "Filtros (n)" repetido | Todos los `Filters*.tsx` | Bajo |
| D5 | Acciones de fila como `Chip` clicables (Editar/Eliminar) con colores warning/error saturados | Todas las `Table*.tsx` | Bajo |
| D6 | Encabezado de tabla en verde sólido; filas cebra con `action.hover` | `_shared/components/TableDefault.tsx` | Bajo (cambio visual global) |
| D7 | Colores fijos en gráficas (148 hex en total; 30 en el layout por Highcharts) | `dashboard/charts/*`, `business-intelligence/epp/charts/*`, `areas/_components/AreaImageCoordinateSelector.tsx` | Medio |
| D8 | Estados de carga y vacío distintos en cada pantalla (`LoadingLinear` en 53 lugares; sin estado vacío común) | Varios | Bajo |

### 2.2 Accesibilidad (`accessibility`, WCAG 2.2 AA)

| # | Hallazgo | Archivo(s) | Riesgo |
|---|---|---|---|
| A1 | Contraste 2.3:1 en encabezados de tabla | `TableDefault.tsx` (`StyledTableCell`) | Bajo |
| A2 | `lang="en"` | `app/layout.tsx` | Bajo |
| A3 | `<main>` anidado; falta landmark único | `app/layout.tsx`, `app/(routes)/layout.tsx` | Bajo |
| A4 | `h1` = nombre de usuario; títulos de página en `h4` | `app/(routes)/layout.tsx`, 45 páginas | Bajo |
| A5 | 44 `IconButton` sin `aria-label`; refrescar sin nombre (24); `aria-label` incorrecto en HDS | Varios | Bajo |
| A6 | Textos de paginación en inglés ("first page", "Rows per page") | `TableDefault.tsx`, `TablePaginationActions.tsx`, `TableDefaultServer.tsx` | Bajo |
| A7 | Errores de formulario solo en toast (no se anuncian junto al campo) | Todos los `form/page.tsx` | Medio (toca presentación del flujo de envío) |
| A8 | Sin enlace para saltar al contenido; foco visible inconsistente fuera del menú | Layout | Bajo |
| A9 | Sin `prefers-reduced-motion` global | Theme / CssBaseline | Bajo |
| A10 | Hoja de "Material Icons" de Google Fonts cargada sin uso (0 usos) | `app/layout.tsx` | Bajo |

### 2.3 Responsividad

| # | Hallazgo | Archivo(s) | Riesgo |
|---|---|---|---|
| R1 | Anchos fijos en px (67 usos) | `AreaImageCoordinateSelector.tsx` (13), `TableEvidences.tsx` (9), `training-guide/page.tsx` (8), `TabsImageAndLogs.tsx` (6) | Medio |
| R2 | Barras de acciones (`Toolbar`) que no se acomodan en 360 px | Páginas de listado | Bajo |
| R3 | Tablas con `minWidth: 500` sin indicación de scroll horizontal | `TableDefault.tsx` | Bajo |

### 2.4 Rendimiento de React (`vercel-react-best-practices`)

| # | Hallazgo | Regla | Archivo(s) | Riesgo |
|---|---|---|---|---|
| P1 | Theme recreado en cada render del layout | `rerender-memo` | `app/(routes)/layout.tsx` | Bajo |
| P2 | Highcharts `.src` en el layout de todas las rutas | `bundle-conditional` | `app/(routes)/layout.tsx` | Medio |
| P3 | `window.location.reload()` al cambiar de tema en `/dashboard` | `rerender-move-effect-to-event` | `app/(routes)/layout.tsx` | Medio |
| P4 | `ApolloWrapper` global, pero solo `useEvidences` (Hallazgos) usa GraphQL | `bundle-conditional` | `app/layout.tsx` | Alto (fuera de alcance) |
| P5 | `dayjs` (11 archivos) y `moment-timezone` (7) conviven | `bundle-*` | Varios | Alto (fuera de alcance) |
| P6 | `TableDefault` sincroniza estado con `useEffect` en lugar de controlarlo | `rerender-derived-state-no-effect` | `TableDefault.tsx` | Medio |
| P7 | `console.log` en producción | — | `epp/_components/DialogCreateEpp.tsx`, `ics/form/page.tsx`, `_shared/utils/index.ts` | Bajo |
| P8 | `html2canvas` y `jspdf` ya se cargan con `import()` dinámico | ✅ correcto | `dashboard/page.tsx` | — |

### 2.5 Next.js (`next-best-practices`)

| # | Hallazgo | Archivo(s) | Riesgo |
|---|---|---|---|
| N1 | Sin `error.tsx` / `global-error.tsx` / `not-found.tsx` | `app/` | Bajo (archivos nuevos, no rutas) |
| N2 | `proxy.ts` no maneja la caída de la API y responde 404 | `proxy.ts` | Medio |
| N3 | Todas las páginas son cliente con `useEffect` + servicio; podrían ser RSC | Todas | Alto (fuera de alcance, restricción 7) |
| N4 | Un `<img>` dentro de HTML generado para impresión de QR (correcto, no aplica `next/image`) | `emergency-teams/page.tsx` | — |
| N5 | `next/font` no se usa; Roboto viene de `@fontsource` (correcto) | `app/layout.tsx` | — |

### 2.6 Tipado (`typescript-advanced-types`)

| # | Hallazgo | Archivo(s) | Riesgo |
|---|---|---|---|
| T1 | `rows: any[]` y `paintRows(value: any)` en tablas | `TableDefault.tsx`, `TableDefaultServer.tsx`, `TableFooterDefault.tsx` | Bajo (genéricos `<T>` compatibles) |
| T2 | `any` en selects | `SelectDefault.tsx`, `MultiSelect*.tsx` | Bajo |
| T3 | `props: any` | `ThemeRegistry.tsx`, `Copyright.tsx` | Bajo |
| T4 | `any` en formularios | `employees/form/page.tsx`, `training-guide/page.tsx` | Medio |

## 3. Hallazgos por módulo

| Módulo | Estado | Problemas principales |
|---|---|---|
| HDS | 🟡 | `aria-label` "expand row" en descargar; tabla propia en vez de `TableDefault`; encabezado repetido |
| Guías de entrenamiento | ⚪ | **Fuera de alcance: módulo sin uso** (ver sección "Fuera de alcance: Guías de entrenamiento") |
| Usuarios, Plantas, Procesos, Criterios, Tipos de criterios | 🟡 | Eliminar sin confirmación; refrescar sin nombre; mensaje equivocado en Criterios y Tipos de criterios ("Planta eliminada correctamente") |
| Colaboradores | 🟡 | Eliminar sin confirmación; `any` en formulario |
| Lugares | 🟢 | Patrón estándar con confirmación |
| Zonas | 🟡 | Selector de coordenadas con 13 anchos fijos |
| Equipos, Temas, Configuración (G. Entr.) | 🟡 | Página única de 600-930 líneas con diálogo propio |
| Equipos de emergencia | 🟡 | 4 `IconButton` sin nombre; impresión de QR por HTML |
| Gemba Walk (configuración) | 🟢 | Reciente y consistente; mismo encabezado repetido |
| Inspección de extintores | 🟡 | `IconButton` sin nombre; escáner de cámara |
| EPP | 🟡 | `console.log`; firma; `IconButton` sin nombre |
| Gemba Walk (recorridos) | 🟢 | Reciente; calendario con colores del theme |
| Hallazgos | 🟡 | Tabla con anchos fijos; GraphQL; flujo más complejo |
| ICS | 🟡 | Eliminar sin confirmación; `console.log` |
| CIAEL | 🟡 | Formulario largo; validación solo por toast |
| Dashboard y Análisis | 🔴 | ~9 800 líneas; colores fijos en gráficas; recarga al cambiar de tema; 5 `IconButton` sin nombre |

🟢 bien · 🟡 mejoras de bajo riesgo · 🔴 grande o con riesgo medio; requiere revisión detallada en su fase

## 4. Patrones repetidos a extraer

| Componente propuesto | Reemplaza | Usos aproximados |
|---|---|---|
| `PageHeader` (título `h1` visual h4, descripción opcional, acciones a la derecha) | `Grid` + `Typography h4` + color por modo + `Toolbar` con Crear/Refrescar | 45 |
| `RefreshButton` (ícono con `aria-label` y tooltip "Actualizar") | `ButtonGroup` + `Button` vacío | 24 |
| `FilterBar` (contenedor con título "Filtros (n)" y grid responsivo) | `Filters*.tsx` con `Paper` por campo | ~20 |
| `RowActions` / `RowActionButton` (Editar, Eliminar, Ver con nombre accesible) | `Stack` + `Chip` clicables | ~25 |
| `ConfirmDialog` (o `useConfirm`) | toast con `action` (13), `Dialog` ad hoc (3) | 16 (+7 si se aprueba agregar confirmación) |
| `EmptyState` | Tablas vacías sin mensaje | Todas las tablas |
| `LoadingState` | `LoadingLinear` suelto | 53 |
| `TableDefault<T>` genérico | `TableDefault` con `any` | 70 |
| `KpiCard` | Tarjetas de KPI del dashboard y BI | Dashboard, BI |

## 5. Propuesta de sistema de diseño

Dirección: **industrial y utilitaria, refinada**. Es un sistema de seguridad industrial usado a diario; la prioridad es claridad, densidad controlada y estados evidentes. Se toma el menú rediseñado como referencia. La tipografía se mantiene en Roboto, porque cambiarla implica instalar otra fuente (ver sección 7).

**Paleta** (en `app/theme.tsx`, un solo lugar):
- `primary.main` `#71BF44` (marca, sin cambio).
- `primary.dark` calculado; para texto sobre fondos claros, `darken(primary.main, 0.45)` (contraste ≥ 4.5:1), igual que el menú.
- `background.default` gris 100 / 900 según modo (ya se usa en el layout).
- `success`, `warning`, `error` e `info` con los valores por defecto de MUI.

**Forma y movimiento:**
- Radios: `shape.borderRadius = 10`; tarjetas y `Paper` 12; diálogos 16.
- Transiciones: 150 ms en hover y foco; se respeta `prefers-reduced-motion`.

**Sombras:** se reducen a niveles 0-2; las superficies se separan con borde `divider`.

**Tipografía:**
- `h4` de página con peso 600.
- `subtitle2` en mayúsculas con espaciado para encabezados de sección, como en el menú.
- `button` sin mayúsculas forzadas.

**Overrides de componentes:**

| Componente | Cambio |
|---|---|
| `MuiButton` | Radio 10, sin mayúsculas, foco visible |
| `MuiIconButton` | Foco visible |
| `MuiPaper` | Radio 12, borde sutil en modo claro |
| `MuiTableCell` (head) | Fondo `alpha(primary, 0.12)` y texto primario oscurecido (corrige A1), peso 600 |
| `MuiTableRow` | Hover suave en lugar de cebra fuerte |
| `MuiChip` | Radio 8 |
| `MuiDialog` | Radio 16, títulos con peso 600 |
| `MuiTextField` / `MuiOutlinedInput` | Radio 10 |
| `MuiTooltip` | Tamaño de texto legible |
| `MuiTablePagination` | Textos en español |
| `MuiCssBaseline` | `:focus-visible` global y `prefers-reduced-motion` |

**Modo oscuro:** un solo theme con `colorSchemes` (light/dark) o `mode` desde el layout, definido una vez fuera del render.

## 6. Plan de ejecución

**Fase 2 — Fundaciones**
1. Tokens y overrides en `app/theme.tsx` (exporta una función `createAppTheme(mode)`).
2. `app/(routes)/layout.tsx` usa ese theme y deja de recrearlo en cada render (P1).
3. A2, A3, A9 y A10 (`lang="es"`, un solo `<main>`, movimiento reducido, quitar la hoja de Material Icons).
4. Verificar que el menú se vea igual.

**Fase 3 — Componentes compartidos**
1. `PageHeader`, `RefreshButton`, `FilterBar`, `RowActions`, `ConfirmDialog`, `EmptyState` y `LoadingState`.
2. `TableDefault<T>` genérico, en español y sin código muerto.
3. Se prueban en **Criterios** (el módulo más simple).

**Fase 4 — Módulos** (orden ajustado; Guías de entrenamiento baja porque es un archivo grande con firmas):
1. HDS
2. Catálogos simples: Criterios, Tipos de criterios, Procesos, Plantas, Lugares, Zonas, Usuarios, Colaboradores
3. Gemba Walk configuración
4. Equipos, Temas, Configuración de G. Entr.
5. Equipos de emergencia
6. Inspección de extintores
7. EPP
8. ~~Guías de entrenamiento~~ (fuera de alcance: módulo sin uso)
9. Gemba Walk recorridos
10. Hallazgos
11. ICS
12. CIAEL
13. Dashboard y Análisis de datos

**Fase 5:** verificación y lista de pruebas manuales. **Fase 6:** skill `comportarte-ui`.

## 7. Fuera de alcance o para decidir

| Tema | Por qué no se aplica sin tu decisión |
|---|---|
| Confirmación al eliminar en 7 módulos | Agrega un paso al flujo actual (regla 4 y 5). Recomendado. |
| Mensaje "Planta eliminada correctamente" en Criterios y Tipos de criterios | Es texto de negocio equivocado; corregirlo es de riesgo bajo, pero cambia un mensaje. |
| Mover Highcharts del layout a las páginas con gráficas (P2) y quitar la recarga al cambiar de tema (P3) | Riesgo medio: los colores de las gráficas en modo oscuro dependen de esa configuración global. |
| Errores de validación en línea en formularios (A7) | Cambia cómo se presenta el error; la lógica se mantiene. |
| `error.tsx` / `not-found.tsx` (N1) | Son archivos nuevos en `app/`, aunque no son rutas. |
| `proxy.ts` ante API caída (N2) | Toca autenticación. |
| Lint roto | Requiere actualizar `eslint-plugin-react` o ajustar la configuración (dependencias, regla 8). Mientras tanto, la verificación usa `build` y `typecheck`. |
| Cambiar la tipografía (la skill `frontend-design` desaconseja Roboto) | Requiere instalar una fuente nueva (regla 8). |
| RSC / obtención de datos en servidor (N3) | Regla 7. |
| `next-cache-components` | No hay oportunidades: todos los datos se obtienen en cliente y no hay `fetch` de servidor que cachear. |
| Apollo global (P4) y `dayjs` + `moment-timezone` (P5) | Cambian dependencias o la forma de obtener datos. |

## 8. Registro de ejecución

### Fase 2 — Fundaciones del sistema de diseño

Aplicado:
- `app/theme.tsx`: `createAppTheme(mode)` con tokens (`theme.tokens.radius`, `theme.tokens.transition`), helpers `primaryTextColor` y `primarySoftBackground`, y overrides de `CssBaseline` (foco visible y movimiento reducido), `Button`, `Paper`, `OutlinedInput`, `Chip`, `Dialog`, `DialogTitle`, `TableCell`, `TablePagination` (textos en español) y `Tooltip`. `shape.borderRadius` se mantiene en 4 para no alterar los 46 `sx={{ borderRadius: n }}` existentes.
- `app/(routes)/layout.tsx`: usa `createAppTheme` con `useMemo([mode])`; ya no crea el theme en cada render (P1). El mecanismo de modo claro/oscuro no cambió. El nombre del usuario deja de ser `h1` (A4), se agregó "Saltar al contenido" (A8) y nombres accesibles en español a los botones del AppBar.
- `app/layout.tsx`: `lang="es"` (A2), sin `<main>` duplicado (A3) y sin la hoja de Material Icons sin uso (A10).
- `app/ThemeRegistry.tsx`: props tipadas (T3).
- `StyledTableCell`: encabezado con fondo verde tenue y texto oscurecido (A1, contraste AA).
- Menú: usa `primaryTextColor` del theme; mismo aspecto.

Verificación: build y typecheck sin errores; lint igual a la línea base. No se verificó en navegador (la API local no está corriendo y el proxy bloquea las páginas sin ella).

#### Qué revisar en la Fase 2

En orden de impacto. Revisar cada punto en **modo claro y oscuro**.

1. **Encabezados de tabla** (el cambio más visible; afecta a casi todos los módulos).
   - Dónde: `/users`, `/hallazgos`, `/gemba-walk/calendar`, `/hds`.
   - Antes: texto blanco sobre verde sólido. Ahora: fondo verde tenue con texto verde oscuro en negritas (en oscuro, texto verde claro).
   - Revisar que se lean bien y que el fondo no se confunda con las filas cebra.
2. **Paginación de tablas.**
   - Dónde: cualquier tabla con más de 5 filas, p. ej. `/users`.
   - Ahora dice "Filas por página" y "1–5 de 20" en lugar del texto en inglés.
   - Los botones de primera/última página todavía tienen nombres en inglés para lectores de pantalla; se corrigen en la Fase 3.
3. **Botones.**
   - Dónde: "Crear" y refrescar en cualquier listado (`/main-types`); "Guardar" y "Cancelar" en formularios (`/users/form`, `/gemba-walk/calendar/form`).
   - Ahora: sin mayúsculas forzadas, sin sombra y con esquinas de 10 px.
   - Revisar que los grupos de botones (`ButtonGroup`) sigan viéndose unidos.
4. **Acciones "Editar" / "Eliminar" en filas** (14 tablas).
   - Dónde: `/main-types`, `/users`, `/gemba-walk/zones`.
   - Ahora: esquinas de 8 px en lugar de forma de píldora.
5. **Filtros.**
   - Dónde: cualquier listado, p. ej. `/main-types`, `/zones`, `/hallazgos`.
   - Hay 35 archivos donde cada campo está dentro de un `Paper`. Ahora el campo tiene radio de 10 px y el `Paper` de 12 px: revisar que no se note un borde o sombra desalineada en las esquinas. Si se nota, se corrige en la Fase 3 con `FilterBar`.
6. **Diálogos.**
   - Dónde: crear o editar un evento en `/gemba-walk/calendar/form`; reasignar responsables y la vista de imagen en `/hallazgos`.
   - Ahora: esquinas de 16 px y título en negritas.
7. **Tarjetas, menús flotantes y paneles** (`Paper` con radio de 12 px).
   - Dónde: `/dashboard` (tarjetas que no definen su propio radio) y los menús flotantes del menú lateral colapsado.
8. **Teclado.**
   - En cualquier pantalla, presionar `Tab` al cargar: debe aparecer arriba a la izquierda "Saltar al contenido". Al seguir con `Tab`, los botones deben mostrar un contorno verde.
9. **Login (`/`).**
   - Usa el mismo theme en modo claro: revisar el botón de entrar y los campos.
10. **Menú lateral.**
    - Debe verse igual que antes. Únicos cambios esperados: los menús flotantes del modo colapsado tienen esquinas más redondeadas, y el contorno de foco con teclado.

Sin cambios esperados: colores de las gráficas, AppBar, fondo general y textos de negocio.

### Fase 3 — Componentes compartidos

Creados en `app/_shared/components`:

| Componente | Propósito |
|---|---|
| `PageHeader` | Título de página como `h1` (estilo h4) con acciones a la derecha; se acomoda en 360 px |
| `RefreshButton` | Botón de solo ícono con `aria-label` y tooltip "Actualizar" |
| `FilterBar` | Sección de filtros con título, contador de registros y grid; sustituye un `Paper` por campo |
| `RowActions`, `EditAction`, `DeleteAction`, `ViewAction` | Acciones de fila con tono suave y contraste AA en claro y oscuro (mínimo 5.06:1 medido) |
| `ConfirmDialog` + `useConfirmDialog()` | Confirmación accesible; el foco inicia en "Cancelar" |
| `EmptyState` | Mensaje "Sin registros"; `TableDefault` lo muestra automáticamente |

Mejorados sin cambiar su API (los ~70 usos compilan sin modificarse):
- `TableDefault<T>` y `TableDefaultServer<T>` genéricos; sin el código muerto; `aria-label` configurable; estado vacío; textos en español ("Todos", "Filas por página"); corregido el `colSpan={6}` fijo de la fila de relleno.
- `TablePaginationActions`: nombres accesibles en español; `TableDefault` ya no tiene una copia propia.
- `TableFooterDefault`: sin `any`; "Todos".
- `LoadingLinear`: `role="status"` y nombre accesible.

No se creó `LoadingState`: `LoadingLinear` ya cumple ese papel tras la mejora.

Pantalla de prueba, **Criterios** (`/main-types`):
- usa `PageHeader`, `RefreshButton`, `FilterBar` y `RowActions`
- eliminar pide confirmación con `ConfirmDialog` (decisión 1)
- el mensaje ahora dice "Criterio eliminado correctamente" (decisión 2)

El formulario de Criterios queda para la Fase 4.

Verificación en navegador (`/main-types`):
- 360, 768 y 1100-1440 px, en claro y oscuro
- sin errores de consola tras recargar
- estructura: un `h1`, un `<main>`, `lang="es"`
- paginación y acciones con nombres en español
- estado vacío revisado con un filtro sin coincidencias

**Sin probar:** el `ConfirmDialog` real, porque abre el flujo de eliminación.

### Fase 4 — Bloque 1: HDS y catálogos simples

Piezas compartidas nuevas (`8eae5a8`):
- `useFieldErrors`: error junto al campo + toast, con foco en el campo. Se importa directo (`@hooks/useFieldErrors`) para no arrastrar Apollo desde el barrel `@hooks`.
- `FormSection` y `FormActions`: los campos van en una sola tarjeta, y "Cancelar" ahora es un botón con borde (antes, rojo sólido como acción destructiva).
- `SelectManufacturingPlantsOwn` ya no trae su propio `Paper`.
- `color-scheme` en el layout, para las barras de scroll en modo oscuro.

| Módulo | Aplicado | No aplicado / notas |
|---|---|---|
| HDS | Encabezado, filtros, `TableDefault`, "Ver archivo" con nombre accesible | — |
| Criterios | Formulario con título, sección, `required` y error junto al campo | (listado en Fase 3) |
| Tipos de criterios | Todo el patrón; confirmación al eliminar; mensaje corregido | El campo "Responsable" dice "(opcional)" en su etiqueta, pero la validación lo exige. Se dejó igual: **para decidir**. |
| Procesos | Todo el patrón; confirmación al eliminar | — |
| Plantas | Todo el patrón; confirmación al eliminar | — |
| Lugares | Todo el patrón; la confirmación pasa de toast a diálogo (mismo texto) | Los mensajes dicen "zona" aunque la pantalla se llama Lugares (`/zones`); no se cambiaron por ser texto de negocio. |
| Zonas | Todo el patrón; diálogo de confirmación (mismo texto); el plano va en su propia sección | Mensajes dicen "área" aunque la pantalla se llama Zonas (`/areas`); no se cambiaron. |
| Usuarios | Todo el patrón; confirmación al eliminar; la contraseña muestra `*` solo al crear | — |
| Colaboradores | Todo el patrón; confirmación al desactivar; sin `as any` en las fechas; sin asterisco duplicado | — |

Verificación:
- **Código:** build y typecheck sin errores; lint igual a la línea base.
- **Consola:** sin errores en los 16 listados y formularios del bloque (se confirmó que el lector captura errores).
- **Anchos y modos:** 360, 768 y 1440 px, en claro y oscuro.
- **Sin confirmar visualmente:** el arreglo de `color-scheme`, porque la API se detuvo durante la revisión.

### Decisiones aplicadas tras el bloque 1

- **Tipos de criterios:** "Responsable" ya se muestra como obligatorio; la validación no cambió.
- **Lugares (`/zones`):** los mensajes y la confirmación dicen "lugar".
- **Zonas (`/areas`):** los mensajes y la confirmación dicen "zona".
- En Lugares, el filtro, la columna y el campo "Zona" se quedaron igual, porque se refieren a la zona a la que pertenece cada lugar.
- **Tablas vacías:** ya no conservan el ancho mínimo, así que el mensaje "Sin registros" no se corta en 360 px.

### Fase 4 — Bloque 2: Gemba Walk configuración, Equipos, Temas, Configuración G. Entr. y Equipos de emergencia

| Módulo | Aplicado | No aplicado / notas |
|---|---|---|
| Gemba Walk - Zonas | Encabezado, filtros, acciones, diálogo de confirmación (mismo texto), formulario con errores junto al campo | — |
| Gemba Walk - Observadores | Igual; el error de usuario aplica a los dos selects (simple al editar, múltiple al crear) | — |
| Gemba Walk - Evaluaciones | Igual | — |
| Gemba Walk - Calendario | Encabezado, filtros, acciones, diálogo de confirmación; se conserva la revisión de eventos pasados | En el formulario del calendario solo cambian el encabezado y el estilo de Cancelar |
| Equipos | Tabla compartida, confirmación con diálogo, "Crear" con texto, errores junto al campo en el diálogo | — |
| Temas | Igual que Equipos; lectura acotada del store (antes se suscribía a toda la sesión) | — |
| Configuración G. Entr. | Igual que Temas; nombre accesible en "quitar tema"; errores junto al campo | **Para decidir:** `DraggableTopicRow` está definido dentro de `ScreenForm` (se remonta en cada render) y el orden de temas solo se cambia arrastrando (WCAG 2.5.7 pide una alternativa sin arrastre). Ambos son de riesgo medio. |
| Equipos de emergencia | Paginación compartida en español, estado vacío, casillas con nombre accesible, confirmación con diálogo, formulario con errores junto al campo; "Imprimir" se conserva igual | La casilla "seleccionar todos" tenía colores blancos fijos y quedaba invisible con el encabezado nuevo (regresión de la Fase 2, corregida aquí). |

Verificación:
- **Código:** build y typecheck sin errores; lint igual a la línea base.
- **Consola:** sin errores en los 16 listados y formularios del bloque, incluidos los diálogos de Equipos y Configuración G. Entr. (abiertos y cerrados sin guardar).
- **Anchos y modos:** 360, 768 y 1440 px, en claro y oscuro.

### Pruebas funcionales de los bloques 1 y 2 (base de desarrollo)

Entorno verificado antes de escribir datos:
- La UI apunta a `http://localhost:4000` y la API a PostgreSQL en `127.0.0.1` (`hallazgos_dev`).
- La API corre con `NODE_ENV=development`, así que los correos se redirigen a una dirección de prueba fija.

Registros creados con prefijo `PRUEBA-UI` y eliminados al terminar, salvo el colaborador de prueba: queda **inactivo** porque la interfaz solo permite desactivar.

| Pantalla | Crear | Editar | Diálogo de eliminar (Esc / Enter / Cancelar no borran; confirmar borra) | Mensaje |
|---|---|---|---|---|
| Criterios | ✅ | ✅ | ✅ las 4 salidas | ✅ |
| Tipos de criterios | ✅ (y error junto al campo en "Responsable") | — | ✅ Esc / confirmar | ✅ |
| Procesos | ✅ | — | ✅ | ✅ |
| Plantas | ✅ | — | ✅ | ✅ |
| Zonas | ✅ con punto en el plano | — | ✅ | ✅ "Zona eliminada" |
| Lugares | ✅ | — | ✅ | ✅ "Lugar eliminado" |
| Usuarios | ✅ (correo inválido: error bajo el campo, foco y toast) | — | ✅ | ✅ |
| Colaboradores | ✅ | — | ✅ "Desactivar" solo en activos; en inactivos no aparece | ✅ |
| Gemba Walk - Zonas | ✅ | — | ✅ | ✅ |
| Gemba Walk - Observadores | ✅ | — | ✅ | ✅ |
| Gemba Walk - Evaluaciones | ✅ | — | ✅ | ✅ |
| Gemba Walk - Calendario | ✅ evento futuro | — | ✅; los eventos pasados muestran "-" | ✅ |
| Equipos | ✅ (error junto al campo en el diálogo) | ✅ | ✅ | ✅ |
| Temas | ❌ la API responde 409 incluso con un nombre nuevo (ver abajo) | — | sin probar | — |
| Configuración G. Entr. | sin probar: la API se detuvo durante la prueba | — | — | — |
| Equipos de emergencia | sin probar: la API se detuvo | — | — | — |

Fallas encontradas y corregidas:
- **Selector del plano (Zonas)**, error previo:
  - con carga directa o recarga de la página, la imagen ya estaba cargada y `onLoad` no se disparaba;
  - las coordenadas se guardaban en píxeles de pantalla en lugar de la escala de la imagen (12396 × 17542), y el punto guardado no aparecía al editar;
  - corregido en `625231c`; verificado en 1440 y 360 px.
- **Multiselects de planta, zona y proceso**, error previo: usaban `PaperProps`, que MUI 9 eliminó; la prop llegaba al DOM con aviso en consola y la altura máxima del menú no se aplicaba. Corregido en `a6e2abd`.

Hallazgos sin corregir (para decidir):
- **Zonas con coordenadas en escala equivocada:** las que se crearon o editaron con la página recargada pueden tener coordenadas en escala de pantalla (valores menores a ~1 600). Conviene revisarlas en la base; afectan el mapa de calor del dashboard.
- **Temas — 409 al crear:** la API traduce cualquier violación de unicidad (`23505`) como "Topic with this name already exists". Como falla también con nombres nuevos, lo más probable es que la secuencia del `id` de `topics` esté desfasada en la base de desarrollo. Es de API o base, no de UI.
- **Mensajes de la API en inglés** que llegan al usuario: "code must be a number…" en Colaboradores y "Topic with this name already exists" en Temas.
- **Colaboradores:** el código de empleado debe ser numérico y el formulario no lo indica.
- **Usuarios:** la contraseña se escribe en un campo de texto visible (`type="text"`).
- **Errores junto al campo en selects:** el error aparece, pero el foco solo se mueve a los campos de texto.

Los pendientes de `DraggableTopicRow` y de los botones subir/bajar se movieron a "Fuera de alcance: Guías de entrenamiento".

### Pendientes fuera de la UI (backend y producción)

1. **Secuencia de `topic` en producción.** En desarrollo, `public.topic_id_seq` estaba en 10 y `MAX(id)` en 19; se ajustó con `setval` solo en `hallazgos_dev`. Para verificar en producción, solo lectura:
   ```sql
   SELECT (SELECT MAX(id) FROM topic) AS max_id, last_value, is_called
   FROM public.topic_id_seq;
   ```
   Si `last_value < max_id`, la corrección es:
   ```sql
   SELECT setval('public.topic_id_seq', (SELECT MAX(id) FROM topic));
   ```
   Conviene revisar también las demás secuencias si la base se restauró desde un respaldo.

2. **Backend: errores de unicidad.** La API traduce cualquier error `23505` como "ya existe ese nombre" (por ejemplo `topics.service.ts`), aunque la causa sea otra, como una secuencia desfasada. Debería revisar la restricción violada (`error.constraint` o `error.detail`) y solo en el caso real responder que el nombre ya existe.

3. **Backend: mensajes en inglés que llegan al usuario.** Ejemplos: "code must be a number conforming to the specified constraints" (validación del DTO de colaboradores) y "Topic with this name already exists". Se dejan sin traducir en la UI, a propósito: la corrección va en la API.

4. **Producción: zonas con coordenadas mal escaladas** por el error del selector del plano, corregido en `625231c`.
   - **Por qué se reconocen:** las coordenadas correctas están en la escala de la imagen `planos.png` (12396 × 17542 px), mientras que las afectadas quedaron en píxeles de pantalla, que no pasan del ancho mostrado del plano (alrededor de 1 600 px).
   - **En desarrollo:** las 12 zonas con punto están entre X 5501 y 7061; ninguna es sospechosa.
   - **Consulta para identificarlas** (solo lectura):
   ```sql
   SELECT a.id,
          a.name,
          mp.name AS planta,
          a."coordinateX",
          a."coordinateY",
          a."zoomLevel",
          a."updatedAt"
   FROM areas a
   LEFT JOIN manufacturing_plant mp ON mp.id = a."manufacturingPlantId"
   WHERE a."isActive" = true
     AND a."coordinateX" IS NOT NULL
     AND a."coordinateY" IS NOT NULL
     AND a."coordinateX" < 1600
     AND a."coordinateY" < 1600
   ORDER BY a."updatedAt" DESC;
   ```
   - **Propuesta de corrección:** volver a marcar cada zona listada desde **Configuración → General → Zonas → Editar**, ya con el selector corregido, y guardar. No se recomienda convertir automáticamente: el factor de escala dependía del ancho con que se mostró el plano en cada guardado, y ese dato no se guardó.
   - **Si se necesita una aproximación masiva:** con un ancho mostrado conocido `W`, la conversión sería `x' = round(x * 12396 / W)` y `y' = round(y * 12396 / W)` (la imagen conserva su proporción). Antes conviene validarla con dos o tres zonas comparando visualmente en el plano.
   - **Riesgo de la consulta:** una zona marcada de verdad en la esquina superior izquierda del plano también cumpliría el criterio. Por eso se revisa la lista antes de corregir.
   - No se ejecutó nada contra producción.

### Fuera de alcance: Guías de entrenamiento (módulo sin uso)

Decisión del 14/10/2026: el módulo `/training-guide` ya no se usa. No se modifica ni se prueba, y no se dispara su firma ni su correo. Lo que se había anotado para él queda registrado aquí por si el módulo se retoma:

- **Propuesta: dividir `training-guide/page.tsx`** (~1 370 líneas en un solo archivo). Partirlo en filtros, tabla, diálogo de alta y edición, captura de firma y vista de evaluación, y después aplicar el patrón del sistema de diseño (encabezado, `FilterBar`, `TableDefault`, `RowActions`, `ConfirmDialog` y errores junto al campo).
- **Configuración G. Entr. — `DraggableTopicRow`:** está definido dentro de `ScreenForm` (regla `rerender-no-inline-components`). Conviene sacarlo a nivel de módulo y pasarle `form`/`setForm` por props. En la prueba de arrastre no se vio que las filas saltaran ni perdieran el foco.
- **Configuración G. Entr. — reordenar temas sin arrastrar:** agregar botones subir/bajar como alternativa al arrastre (WCAG 2.5.7).

Configuración G. Entr. y Temas sí recibieron el patrón visual en el bloque 2 y se probaron de punta a punta, porque ya estaban hechos antes de esta decisión.

### Correcciones y pruebas posteriores

**Correcciones de UI** (`70d6cb9`), probadas en el navegador:
- **Usuarios:** la contraseña usa `type="password"` y tiene un botón "Mostrar/Ocultar contraseña" con `aria-pressed`; funciona al crear y al editar.
- **Colaboradores:** el código de empleado muestra la ayuda "Solo números" y usa `inputMode="numeric"`; la validación no cambió.
- **`useFieldErrors`:** el foco también llega a los selects, buscando el mensaje con `data-error-for`. Probado en "Responsable" (Tipos de criterios) y "Tipo de evaluación" (Temas).
  - Caso límite: si el mensaje vive en un `Grid` aparte y el control anterior está deshabilitado, el foco no se mueve. Ejemplo: "Debe agregar al menos un tema" en Configuración G. Entr., cuyo botón "Agregar tema" está deshabilitado.

**Cierre de las pruebas del bloque 2:**
- **Temas:** crear funciona tras corregir la secuencia. Los dos temas de prueba se eliminaron con el diálogo durante una desconexión de la extensión; no se alcanzó a ver el mensaje final.
- **Configuración G. Entr.:**
  - agregar dos temas, reordenar arrastrando (sin saltos), quitar uno ("Quitar el tema …") y guardar;
  - revisar la edición y eliminar (Esc no borra; confirmar sí).
- **Equipos de emergencia:**
  - selección individual: "Imprimir (1)" y encabezado en estado parcial;
  - "seleccionar todos": marca las 5 filas de la página y desmarca todas;
  - impresión: se interceptó `window.open` para no abrir el diálogo de impresión del navegador; genera una ventana con el QR en PNG y llama a `print()`;
  - eliminar: Esc no borra; confirmar sí.

### Fase 4 — Bloque 3: Inspección de extintores y EPP

| Módulo | Aplicado | Probado | Pendiente |
|---|---|---|---|
| Inspección de extintores | Listado con `PageHeader` y `FilterBar`. Formulario: título ("Nueva inspección…" / "Agregar evaluaciones…"), fecha sin `Paper` propio, Cancelar sin rojo, "Evaluaciones" como `h2`, datos del equipo con colores del theme (antes `#1976d2` fijo y etiquetas en `primary.main` sin contraste AA), sin `Paper` por campo | Listado y formulario en 1440, 700 y 360 px, claro y oscuro, sin errores de consola | **Cámara:** no se abrió el escáner (pediría permiso de cámara al navegador). Sin escanear un QR no se pueden agregar evaluaciones, así que no se creó ninguna inspección. |
| EPP | Título con "Crear registro" y Actualizar. Tabla: nombres en español; la descarga ahora es un botón usable con teclado (antes un ícono SVG con `onClick`); confirmación del historial con `ConfirmDialog`. Diálogo de registro: título "Registro de EPP", "Cerrar", texto alternativo de la firma, nombre accesible en "Quitar …"; se quitó el `console.log`. | Planta, colaborador, equipo, agregar y firma en 1440 y 360 px | **Guardar la entrega y eliminar del historial:** la API responde 500 por secuencias desfasadas (ver abajo). |

**Firma de EPP** (sin cambiar la lógica ni la imagen guardada):
- **Antes:** el canvas dibujaba en 500 × 200 pero se mostraba estirado a 466 × 198. Con el puntero al 90 % del ancho, el trazo quedaba **34 px antes**.
- **Corrección:** el canvas se muestra exactamente al tamaño en que dibuja (500 × 200 en escritorio, 300 × 200 en móvil).
- **Después:**
  - 1440 px: puntero 50 → 450, trazo 48 → 443;
  - 360 px: puntero 30 → 270, trazo 28 → 262.
  
  La diferencia que queda es el suavizado normal del trazo.

**Secuencias desfasadas en `hallazgos_dev`** (solo lectura; no se corrigieron):

| Tabla | Secuencia | `MAX(id)` | Efecto |
|---|---|---|---|
| `epp` | 3819 | 3819 | Chocó en el primer intento (el 23505 de la consola: `(id)=(3819)`); ese intento la dejó alineada |
| `epp_equipment` | 4376 | 4377 | Guardar una entrega de EPP fallará |
| `employee_area` | 26 | 27 | Crear un área de colaborador fallará |
| `employee_position` | 193 | 195 | Crear un puesto fallará |
| `machines` | 35 | 44 | Crear una máquina fallará |
| `cie-diagnoses` | sin usar | 10 | Crear un diagnóstico fallará |

**API — mensaje de error explícito** (`hallazgos-api/src/shared/filters/query-failed-exception.filter.ts`, registrado en `main.ts`):
- Atrapa solo `QueryFailedError` no manejados y no cambia el resto de las excepciones.
- **Unicidad (23505)** → 409 con mensaje en español: tabla y valor duplicado, y si es el `id`, aviso de secuencia desfasada.
- **Otros errores de base de datos** → 500 con mensaje claro y su código.
- En GraphQL devuelve la excepción tal cual.
- Probado con errores simulados sobre la versión compilada. Sin commit: está en la rama `main` de `hallazgos-api`.

### Secuencias de ids: corrección en desarrollo y consultas para producción

En `hallazgos_dev` se revisaron las 53 tablas con `id` serial. Había 5 desfasadas además de `topic` (`cie-diagnoses`, `employee_area`, `employee_position`, `epp_equipment` y `machines`), y se corrigieron con `setval`. La verificación posterior no encontró ninguna. **No se ejecutó nada contra producción.**

**1. Verificar en producción** (solo lectura). Lista las tablas cuya secuencia entregaría un `id` que ya existe:
```sql
SELECT t.tabla,
       t.secuencia,
       t.max_id,
       COALESCE(s.last_value + s.increment_by, s.start_value) AS siguiente
FROM (
  SELECT c.relname AS tabla,
         pg_get_serial_sequence(quote_ident(c.relname), 'id') AS secuencia,
         (xpath('/row/m/text()',
                query_to_xml(format('SELECT max(id) AS m FROM %I', c.relname), false, true, '')))[1]::text::bigint AS max_id
  FROM pg_class c
  JOIN information_schema.columns col
    ON col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = 'id'
  WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
) t
JOIN pg_sequences s ON s.schemaname || '.' || s.sequencename = replace(t.secuencia, '"', '')
WHERE t.secuencia IS NOT NULL
  AND t.max_id IS NOT NULL
  AND (COALESCE(s.last_value + s.increment_by, s.start_value)) <= t.max_id
ORDER BY t.tabla;
```

**2. Corregir en producción**, solo después de revisar el resultado anterior y con respaldo. Ajusta únicamente las secuencias atrasadas:
```sql
DO $$
DECLARE
  r record;
  max_id bigint;
  seq text;
BEGIN
  FOR r IN
    SELECT c.relname AS tabla
    FROM pg_class c
    JOIN information_schema.columns col
      ON col.table_schema = 'public' AND col.table_name = c.relname AND col.column_name = 'id'
    WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
  LOOP
    seq := pg_get_serial_sequence(quote_ident(r.tabla), 'id');
    CONTINUE WHEN seq IS NULL;
    EXECUTE format('SELECT max(id) FROM %I', r.tabla) INTO max_id;
    CONTINUE WHEN max_id IS NULL;
    IF (SELECT COALESCE(last_value + increment_by, start_value)
        FROM pg_sequences WHERE schemaname || '.' || sequencename = replace(seq, '"', '')) <= max_id THEN
      PERFORM setval(seq, max_id, true);
      RAISE NOTICE 'Secuencia % ajustada a %', seq, max_id;
    END IF;
  END LOOP;
END $$;
```

**API — mensaje de error de base de datos** (rama `fix/mensaje-errores-bd` de `hallazgos-api`, `58b6db1`). El usuario solo ve mensajes en español sin tablas, columnas ni ids:

| Caso | Respuesta | Mensaje |
|---|---|---|
| Duplicado por secuencia | 409 | "No se pudo guardar el registro. Avise al administrador del sistema." |
| Duplicado real | 409 | "No se pudo guardar: ya existe un registro con esos datos." |
| Otros errores de base de datos | 500 | "No se pudo completar la operación. Avise al administrador del sistema." |

El log de la API registra código, tabla, restricción y detalle.
