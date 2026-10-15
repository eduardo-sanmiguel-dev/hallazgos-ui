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
| Guías de entrenamiento | 🔴 | Archivo único de ~1 370 líneas; firmas; anchos fijos; `any` |
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
8. Guías de entrenamiento
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
