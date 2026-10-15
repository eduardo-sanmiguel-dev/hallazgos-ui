---
name: comportarte-ui
description: Sistema de diseño de la UI de Hada ComportArte (hallazgos-ui, Next.js + MUI). Úsala al crear o modificar cualquier página, formulario, tabla, diálogo o gráfica del sistema, al revisar la consistencia visual o la accesibilidad de un módulo, o cuando pidan "aplicar el patrón", "que se vea como el resto del sistema" o "mejorar la UI" de una pantalla.
metadata:
  version: "1.0"
---

# ComportArte UI

Reglas y piezas del sistema de diseño de `hallazgos-ui`. El origen y el detalle de cada decisión están en `AUDITORIA-UI.md`.

## Cuándo usarla

- Al crear una pantalla nueva: listado, formulario, detalle o diálogo.
- Al modificar una pantalla existente, para dejarla con el patrón.
- Al revisar diseño, accesibilidad o comportamiento en móvil de un módulo.
- Al agregar o cambiar gráficas de Highcharts.

Para criterios generales, complementa con `accessibility`, `frontend-design` y `vercel-react-best-practices`. Esta skill manda en lo específico del sistema.

## No romper funcionalidad

Un cambio de UI **no** modifica nada de lo siguiente:

- servicios (`app/_services`), stores (`app/_store`), interfaces ni payloads;
- rutas, `proxy.ts`, permisos ni la visibilidad del menú;
- dependencias (`package.json`);
- textos de negocio que el usuario reconoce, salvo errores evidentes (acentos, mensajes equivocados), y avisando;
- la lógica de firma (canvas) y de cámara/QR.

Mantén las mismas llamadas a servicios y las mismas navegaciones. Si cambian de lugar (por ejemplo, dentro de una confirmación), deben seguir siendo idénticas. Para comprobarlo:

```bash
for k in 'router\.(push|replace)\("[^"]*' 'Service\.[a-zA-Z]+'; do
  diff <(git diff main -U0 -- app | grep -E "^-[^-]" | grep -oE "$k" | sort) \
       <(git diff main -U0 -- app | grep -E "^\+[^+]" | grep -oE "$k" | sort)
done
```

**Verificación mínima por cambio:**
- `npm run build`, `npm run typecheck` y `npm run lint`. La línea base es 0 errores y 2 advertencias (`exhaustive-deps` en `MultiSelectProcesses` y `MultiSelectZones`).
- Revisar en el navegador a 1440 y 360 px, en claro y oscuro, sin errores de consola.

**Formato:** no pases Prettier a archivos que en `main` no estaban formateados. Infla el diff y esconde el cambio real.

## Tokens (`app/theme.tsx`)

`createAppTheme(mode)` crea el theme de MUI para `"light"` o `"dark"`. Todo color sale de `theme.palette`; el único color fijo es la marca.

| Token | Valor | Uso |
|---|---|---|
| `BRAND_PRIMARY` | `#71BF44` | `palette.primary.main` |
| `theme.tokens.radius.sm` | 8 | Chips |
| `theme.tokens.radius.md` | 10 | Inputs, botones |
| `theme.tokens.radius.lg` | 12 | `Paper` |
| `theme.tokens.radius.xl` | 16 | Diálogos, tarjetas destacadas |
| `theme.tokens.transition.fast` | 150 ms | Hover y foco |

**Helpers:**
- `primaryTextColor(theme)`: texto o ícono en color primario con contraste AA. Sobre blanco, el verde de marca solo llega a ~2.3:1.
- `primarySoftBackground(theme)`: fondo tenue primario, para el ítem activo o el encabezado de una tabla.

```tsx
// Ruta relativa a app/theme.tsx (no hay alias para el theme).
import { primaryTextColor } from "../../theme";

<Typography sx={(theme) => ({ color: primaryTextColor(theme) })}>…</Typography>
<Box sx={(theme) => ({ borderRadius: `${theme.tokens.radius.lg}px` })} />
```

**Reglas:**
- `shape.borderRadius` sigue en 4. `sx={{ borderRadius: 2 }}` equivale a 8 px; para valores del sistema usa `theme.tokens.radius`.
- **Nada de colores fijos** (`#1976d2`, `"white"`, `#fff` en texto). Usa `text.primary`, `text.secondary`, `divider`, `action.hover`, `background.paper` o `primary.main`.
- El theme ya trae: botones sin mayúsculas, `TablePagination` en español, foco visible (`.Mui-focusVisible`) y movimiento reducido.
- **En `sx`, los números entre 0 y 1 son porcentajes:** `width: 1` es 100 %. Para 1 px escribe `"1px"`.

## Componentes compartidos (`app/_shared/components`)

### `PageHeader`: título y acciones de la página

Toda página tiene un `h1`, y solo uno.

```tsx
<PageHeader title="Índice de Comportamiento Seguro">
  <Button variant="contained" startIcon={<AddIcon />} onClick={create}>Crear</Button>
  <Button variant="outlined" startIcon={<SimCardDownloadIcon />} loading={isExcel}>Excel</Button>
  <RefreshButton onClick={getData} />
</PageHeader>
```

- **Acción principal:** botón `contained`. Las secundarias van en `outlined`.
- **Formularios:** el título es "Nuevo …" o "Editar …".
- **Páginas sin espacio para el encabezado** (Dashboard): usa un `h1` oculto visualmente.

### `RefreshButton`

Botón de solo ícono con `aria-label` y tooltip "Actualizar".

### `FilterBar`: filtros del listado

```tsx
<FilterBar count={rows.length}>
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <TextField label="Nombre" fullWidth … />
  </Grid>
</FilterBar>
```

- Ya es un `Grid container`: cada filtro va en un `Grid` hijo.
- No envuelvas cada campo en `Paper`.
- Conserva los chips de filtros activos y "Limpiar filtros" si el módulo los tenía.

### Tablas: `TableDefault<T>` (paginación en cliente) y `TableDefaultServer<T>` (en servidor)

```tsx
<TableDefault
  rows={rows}
  columns={["ID", "Nombre", "Acciones"]}
  ariaLabel="Registros de ICS"
  emptyMessage="Sin registros de ICS"
  paintRows={(row: ICSData) => (
    <StyledTableRow key={row.id}>
      <StyledTableCell>{row.id}</StyledTableCell>
      …
    </StyledTableRow>
  )}
/>
```

- El estado vacío y el `minWidth` (solo cuando hay filas) ya vienen incluidos.
- En una tabla propia, agrega `EmptyState` en una fila con `colSpan`.

### `RowActions`, `EditAction`, `DeleteAction` y `ViewAction`: acciones por fila

Chips en tono suave con contraste AA en claro y oscuro.

```tsx
<RowActions>
  <EditAction onClick={() => router.push(`/x/form?id=${row.id}`)} />
  <DeleteAction onClick={() => confirmRemove(row)} />
</RowActions>
```

### `useConfirmDialog()`: toda acción destructiva o irreversible

```tsx
const { confirm, confirmDialog } = useConfirmDialog();

const confirmRemove = async (row: Row) => {
  const confirmed = await confirm({
    title: "Eliminar registro de ICS",
    description: `¿Deseas eliminar el registro de ICS #${row.id}?`,
    confirmLabel: "Eliminar",
    tone: "danger",
  });
  if (confirmed) remove(row.id);
};

return <>{/* … */}{confirmDialog}</>;
```

- El foco inicia en Cancelar y Esc no confirma.
- **No uses `toast` con botones de acción para confirmar.**
- Los dos botones deben decir cosas distintas: "Volver" y "Cancelar hallazgo", no "Cancelar" y "Cancelar".

### `FormSection` y `FormActions`: formularios de página

```tsx
<FormSection title="Datos generales">
  <Grid size={{ xs: 12, md: 4 }}>…</Grid>
</FormSection>
<FormActions onCancel={() => router.back()} onSave={save} isSaving={isLoading} saveLabel="Guardar" />
```

Cancelar nunca va en rojo: es `outlined`/`text`.

### Otros componentes

- **`EmptyState`:** listas o tablas sin registros (`title`, `description`, acciones opcionales).
- **`LoadingLinear`:** carga con `role="status"`.
- **`StatusPage`:** pantallas de error y 404 (ya usado por `app/(routes)/error.tsx` y `app/not-found.tsx`).

## Errores de validación: `useFieldErrors`

El error aparece junto al campo, conserva el toast y mueve el foco. Importa siempre desde `@hooks/useFieldErrors`, no desde el barrel `@hooks`, que arrastra Apollo.

```tsx
const { fail, errorOf, fieldProps } = useFieldErrors<"name" | "plantId">(form);

if (!form.name.trim()) { fail("name", "El nombre es obligatorio"); return; }
if (!form.plantId) { fail("plantId", "Seleccione una planta"); return; }

<TextField label="Nombre *" {...fieldProps("name")} … />

<SelectDefault label="Planta *" … />
{errorOf("plantId") && (
  <FormHelperText data-error-for="plantId" error>{errorOf("plantId")}</FormHelperText>
)}
```

- **TextField:** `fieldProps(campo)` le da `id`, `error` y `helperText`.
- **DatePicker:** `slotProps={{ textField: { ...fieldProps("fecha") } }}`.
- **Selects y Autocomplete:** un `FormHelperText` con `data-error-for`, en el mismo `Grid` que el control. El foco busca el control junto al mensaje.
- **Cuándo se oculta el error:** en cuanto cambia el estado pasado al hook. No hace falta limpiarlo.
- **Mensajes largos que no son de un campo:** dejarlos solo como toast.
- **Asteriscos:** solo uno en la etiqueta del campo obligatorio, sin duplicar.

## Gráficas: `useHighchartsTheme`

```tsx
const chartsMode = useHighchartsTheme(); // en la página, antes de las gráficas

<Grid key={chartsMode} container>…gráficas…</Grid>
```

- El hook aplica a Highcharts los colores del theme (fondo, títulos, leyendas, ejes y botón de exportar) y devuelve el modo.
- La `key` vuelve a crear las gráficas al cambiar de tema.
- **No recargues la página** (`window.location.reload`) ni llames `Highcharts.setOptions` desde el layout.
- **Dentro de cada gráfica:** usa `theme.palette`. El fondo puede ser `"transparent"` si la gráfica está dentro de un `Paper`.

## Patrones de página

**Listado:**
1. `PageHeader` con Crear, exportaciones y `RefreshButton`.
2. `FilterBar`.
3. `LoadingLinear` o la tabla.
4. En la tabla, `RowActions` con confirmación.

**Formulario de página:**
1. `PageHeader` con "Nuevo …" o "Editar …".
2. `FormSection` con los campos en `Grid` (`xs: 12`, `sm: 6`, `md: 3` o `4`).
3. `FormActions`.
4. Errores con `useFieldErrors`.

**Diálogo a pantalla completa** (CIAEL, EPP):
- `AppBar` con botón "Cerrar" (`aria-label="Cerrar"`), título `h2` descriptivo ("Nuevo registro CIAEL") y "Guardar".
- Contenido con relleno responsivo `p: { xs: 2, sm: 3, md: 5 }`.

**Detalle:** `PageHeader` con el nombre del registro y "Volver"; datos en `Paper` con `Typography` del theme.

**Errores:**
- `app/(routes)/error.tsx`: Reintentar con `retry` (la prop de Next 16) e "Ir al inicio".
- `app/not-found.tsx`: página 404.

## Accesibilidad y responsivo

**Accesibilidad:**
- **Botones de solo ícono:** siempre `aria-label` en español, por ejemplo "Cerrar", "Actualizar", `Acciones del hallazgo ${id}` o `Quitar a ${nombre}`. No uses "close" ni "simple table".
- **Encabezados:** un `h1` por página, `h2` en diálogos y secciones, sin saltos de nivel.
- **Contraste AA:** el texto verde se escribe con `primaryTextColor`, y en chips de warning o error se usa el tono suave de `RowActions`.
- **Foco:** visible siempre. No pongas `autoFocus` en acciones destructivas. Al fallar la validación, el foco va al campo.
- **Elementos clicables:** son `Button`, `IconButton` o `Chip`; nunca un `svg` o `div` con `onClick`.
- **Imágenes:** con `alt`; las firmas, con su descripción.

**Responsivo:**
- **360 px:** sin scroll horizontal de la página. Una tabla puede desplazarse dentro de su contenedor; la página no.
- **Pestañas:** `variant={isMobile ? "scrollable" : "fullWidth"}` con `allowScrollButtonsMobile`.
- **Canvas** (firma): se muestra al mismo tamaño en que dibuja; si no, el trazo se desfasa del puntero.
- **Para probar anchos sin cambiar la ventana:** abre la ruta dentro de un `iframe` del mismo origen de 360 px y compara `scrollWidth` contra `clientWidth`.

## Textos

- Español neutro, con acentos.
- Mensajes de error claros y sin detalles técnicos: nada de tablas, columnas ni ids. El detalle técnico va al log de la API.
- Fechas en formato `DD/MM/YYYY`.
