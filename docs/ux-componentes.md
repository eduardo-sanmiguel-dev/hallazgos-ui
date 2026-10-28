# Componentes base de UX

Fase 2 del plan de mejora de UX (ver `docs/ux-auditoria.md`, secciones 2, 3 y
6). Aquí está lo que ya existe para que cada módulo lo use en la Fase 4.

Todos viven en `app/_shared/` y respetan los tres temas (claro, oscuro y
halloween).

---

## 1. Tema (`app/theme.tsx`)

### Áreas táctiles (A2)

Solo en pantallas táctiles (`@media (pointer: coarse)`, exportado como
`TOUCH_MEDIA`). En escritorio, con mouse, nada cambia de tamaño.

| Elemento | Mínimo en pantalla táctil |
| --- | --- |
| `Button` mediano y grande | 48 px de alto |
| `Button` chico | 44 px |
| `IconButton` mediano | 48 × 48 px |
| `IconButton` chico | 44 × 44 px |
| `Chip` que se toca (acciones de fila, estatus) | 44 px de alto |
| `MenuItem`, `ListItemButton` | 48 px |
| `Checkbox`, `Radio` | 48 px (relleno de 12 px) |
| `ToggleButton` | 44 px |
| Botones de `PageHeader` | 48 px (40 px en escritorio) |

Los `IconButton` dentro de un campo (calendario, ver contraseña, abrir lista)
no crecen: el campo completo ya es el área táctil.

Para un caso propio: `sx={{ [TOUCH_MEDIA]: { minHeight: 48 } }}`.

### Contraste (A3)

| Color | Uso | Contraste sobre blanco |
| --- | --- | --- |
| `#71BF44` (marca) | Rellenos: botón `contained`, chip `filled`, logo, indicadores | Texto oscuro encima: 9.2:1 |
| `text.brand` (verde oscuro, `rgb(62,105,37)`) | Texto e íconos verdes sobre fondo claro | 6.4:1 |
| `warning.main` `#B45309` | Advertencia (antes `#ED6C02`, 3.1:1) | 5.0:1 |
| `info.main` `#0277BD` | Información (antes `#0288D1`, 3.9:1) | 4.8:1 |

En modo claro, el tema ya aplica `text.brand` a: botones `text` y `outlined`,
`IconButton`, `Chip` `outlined`, `Link`, `Typography` y `SvgIcon` con
`color="primary"`, `Checkbox` y `Radio` marcados, pestaña activa y etiqueta de
campo enfocada. Los rellenos no cambian.

En código propio, para texto o ícono verde: `sx={{ color: "text.brand" }}`
(no `"primary.main"`).

En oscuro y halloween se usa el tono claro del primario; los colores
semánticos son los de MUI.

### Colores semánticos (`app/_shared/constants/semanticTones.ts`)

Nombres de la paleta de MUI (`success`, `warning`, `info`, `error`,
`default`), así siguen al tema.

| Concepto | Valor → tono |
| --- | --- |
| Estatus de hallazgo (`EVIDENCE_STATUS_TONE`) | Abierto → warning · En progreso → info · Cerrado → success · Cancelado → error |
| Nivel de riesgo (`RISK_LEVEL_TONE`, nombres del API) | Bajo → success · Medio → info · Alto → warning · Critico → error |
| Plazo (`DEADLINE_TONE`) | overdue (vencido) → error · onTime (cerrado en tiempo) → success · late (cerrado fuera de tiempo) → error |

---

## 2. Componentes

### `StatusChip` / `EvidenceStatusChip`

`app/_shared/components/StatusChip.tsx`

```tsx
<EvidenceStatusChip status={row.status} onClick={...} clickable />
<StatusChip label="Vencido" tone={DEADLINE_TONE.overdue} size="small" />
```

- El color nunca va solo: siempre hay texto, y en estatus de hallazgo también
  ícono.
- Acepta las props de `Chip` (menos `color`, que se reemplaza por `tone`).
- Se usa en la tabla, las tarjetas de celular y el detalle de hallazgos.

### `PhotoCapture`

`app/_shared/components/PhotoCapture.tsx`

```tsx
const upload = useUploadProgress();

<PhotoCapture
  file={file}
  onChange={setFile}
  uploadProgress={upload.progress}
/>

Service.create(formData, { onUploadProgress: upload.onUploadProgress })
  .finally(upload.reset);
```

- **Tomar foto** (principal): `<input type="file" accept="image/*"
  capture="environment">` abre la cámara trasera del teléfono (mejor enfoque,
  flash y resolución). En escritorio abre el selector de archivos.
- **Elegir de galería**: mismo input, sin `capture`.
- **Usar cámara del navegador** (alternativa): `react-html5-camera-photo`,
  cargado solo al pedirlo (`PhotoCaptureBrowserCamera.tsx`), a la resolución
  máxima de la cámara y sin espejo.
- Toda foto pasa por `compressEvidenceImage`
  (`app/_shared/utils/evidenceImage.ts`): máximo 1920 px en el lado mayor y
  ~1 MB. PNG y WEBP se conservan; todo lo demás (JPG, HEIC) sale como JPG. La
  extensión coincide con el contenido, porque el API valida ambas cosas y
  limita a 2 MB.
- Mensajes claros si el archivo no es imagen, si no se pudo procesar, si sigue
  pesando más de 2 MB o si no abre la cámara del navegador (antes solo
  quedaba en consola).
- Vista previa adaptable (260 px de alto en celular, 360 px en escritorio),
  tamaño del archivo y botón "Quitar foto".
- Con `uploadProgress` muestra "Subiendo foto… N %" con barra.
- Botones apilados a ancho completo en celular.

`ImageORCamera` quedó como envoltorio de `PhotoCapture` con su interfaz de
siempre, así que hallazgos (crear, iniciar, cerrar) e ICS ya usan la cámara
nativa. El progreso de subida está conectado en ICS y en crear, iniciar y
cerrar hallazgo.

Los servicios `EvidencesService.create`, `.solution`, `.processStart` e
`IcsService.create` aceptan `{ onUploadProgress }` como último parámetro
opcional.

### `ResponsiveTable`

`app/_shared/components/ResponsiveTable.tsx`

Tabla en tablet y escritorio; tarjetas en celular (< 600 px).

```tsx
const columns: ResponsiveColumn<User>[] = [
  { id: "id", header: "ID", cell: (r) => r.id, rowHeader: true, card: "hidden" },
  { id: "name", header: "Nombre", cell: (r) => r.name, card: "title" },
  { id: "email", header: "Correo", cell: (r) => r.email, card: "subtitle" },
  { id: "role", header: "Rol", cell: (r) => r.role }, // card: "field"
];

<ResponsiveTable
  rows={rows}
  columns={columns}
  getRowKey={(r) => r.id}
  pagination={pagination}            // de usePaginatedList
  ariaLabel="Usuarios"
  actions={(r) => <RowActions>…</RowActions>}
/>
```

- `card`: `"title"` (negritas), `"subtitle"` (gris), `"field"` (etiqueta:
  valor, por omisión) o `"hidden"` (solo en tabla).
- Las acciones van en la última columna de la tabla y al pie de la tarjeta.
- Misma paginación, vacío y error que `TableDefaultServer`.
- Ya se usa en **Usuarios**. Siguen Colaboradores (M6) y, en la Fase 4, la
  lista de hallazgos con tarjetas propias (C1).

### `EmptyState`, `ErrorState`, `NoAccessState`

Mismo diseño (ícono en círculo, título, descripción, acciones).

```tsx
<EmptyState title="Sin hallazgos" description="…"><Button>Crear</Button></EmptyState>
<ErrorState onRetry={refetch} />          // "No se pudo cargar" + Reintentar
<ErrorState offline onRetry={refetch} />  // "Sin conexión"
<NoAccessState homeHref="/hds" />         // "No tienes acceso a esta sección"
```

- `EmptyState` ganó `tone` (`neutral`, `error`, `warning`) y `role`.
- `ErrorState` y `NoAccessState` usan `role="alert"`.
- **Tablas:** `TableDefaultServer` muestra solo "Sin registros" cuando no hay
  filas, o `ErrorState` con "Reintentar" si la consulta falló (detecta "sin
  conexión" con `navigator.onLine`). `usePaginatedList` ya entrega
  `isError` y `onRetry` en `pagination`, así que las 18 listas que usan
  `TableDefaultServer` lo tienen sin cambios. Para un texto propio:
  `emptyTitle` y `emptyDescription`.

### Bloqueo de páginas sin acceso (`RouteAccessGuard`)

`app/_shared/components/RouteAccessGuard.tsx`, montado una vez en
`app/(routes)/layout.tsx`.

- Regla: una página se puede ver si su opción del menú es visible para el
  usuario (`canAccessPath` en `menu.tsx`, la opción de URL más larga que sea
  prefijo de la ruta). Así menú y página nunca se contradicen.
- Quien entra por URL a algo que su menú no muestra ve `NoAccessState` y la
  página no se monta (no hace consultas).
- Si es el dashboard (inicio tras el login), se redirige a su primera página
  disponible (por ejemplo, el usuario solo-HDS va a `/hds`).
- Gemba Walk sigue validando "observador" en su propia página
  (`GembaWalkAccessGuard`, que ahora también usa `NoAccessState`). Sus
  pantallas de configuración quedan solo para administradores, igual que en
  el menú.
- **No cambia permisos:** el API sigue validando cada petición.

### Navegación inferior en celular (`MobileBottomNav`)

`app/_shared/components/MobileBottomNav.tsx`, montada una vez en
`app/(routes)/layout.tsx`. Solo en celular (< 600 px).

- **"Nuevo hallazgo"** al centro: botón redondo de 60 px en verde de marca
  que sobresale de la barra, con la etiqueta "Nuevo". Lleva a
  `/hallazgos/form`.
- **Accesos:** hasta 3 más (4 en total). Salen de la misma regla del menú
  (`canAccessPath`): de esta lista en orden de prioridad se toman los
  primeros 3 que el usuario puede abrir, y se muestran en orden fijo.

  | Prioridad | Acceso |
  | --- | --- |
  | 1 | Hallazgos |
  | 2 | Gemba Walk |
  | 3 | EPP |
  | 4 | Extintores |
  | 5 | Dashboard |

  Resultado por rol:

  | Rol | Barra (izquierda → derecha) |
  | --- | --- |
  | Administrador | Hallazgos · Gemba Walk · **Nuevo** · EPP |
  | General u observador de Gemba Walk | Dashboard · Hallazgos · **Nuevo** · Gemba Walk |
  | General no observador / Supervisor | Dashboard · **Nuevo** · Hallazgos |
  | Solo-EPP | Hallazgos · EPP · **Nuevo** · Extintores |
  | Solo-HDS | Sin barra (no puede crear hallazgos) |

- **Se oculta** en formularios (rutas `/form`), con el teclado abierto (foco
  en un campo de texto, o el área visible se encoge) y debajo de los diálogos:
  todos, también los de pantalla completa, quedan por encima y la cubren.
- Reserva su alto al final del contenido, para que nada quede debajo.
- El acceso a Gemba Walk ("observador") se consulta una sola vez para el menú
  y la barra (`useGembaWalkAccess`, con React Query).
- En **modo dev**, el indicador de Next.js y el botón de React Query Devtools
  quedan encima del primer acceso (abajo a la izquierda). En producción no
  existen.

### Skeletons y `loading.tsx`

`app/_shared/components/Skeletons.tsx`: `ListSkeleton`, `FormSkeleton`,
`DashboardSkeleton`, con `role="status"` y "Cargando…".

`loading.tsx` (se muestran al navegar mientras carga la ruta):

- `app/(routes)/loading.tsx` → lista (cubre todas las listas).
- `app/(routes)/dashboard/loading.tsx` → dashboard.
- Cada carpeta `form/` → formulario.

### `FormSection`

Ganó `description` opcional, y con `title` la sección queda nombrada para
lectores de pantalla (`aria-labelledby`). Base para dividir CIAEL en
secciones (A6, Fase 4).

### `ConfirmDialog` / `useConfirmDialog`

Sin cambios de API. Ya lo usan todas las eliminaciones y el cierre de
hallazgo; el aviso "Eventos sin guardar" del calendario de Gemba Walk pasó de
un `Dialog` propio a `ConfirmDialog` (mismos textos).

Pendiente: el componente promete que el foco inicia en "Cancelar"
(`autoFocus`), pero en la prueba e2e el foco no queda ahí. Revisar en la
Fase 5.

---

## 3. Errores del API (Fase 3)

### Formato de error del API

Todas las respuestas de error del API REST (filtro `ApiExceptionFilter`):

```jsonc
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",   // estable: la UI decide con él
  "message": "Revisa 2 campos: Ubicación y Capacidad.", // siempre texto
  "error": "Bad Request",
  "errors": { "location": "Debe tener entre 5 y 150 caracteres." }, // validación
  "ref": "E-7K3Q9P"              // solo en 500 (también en el log)
}
```

- Validación: un mensaje por campo, sin etiqueta. El resumen sí la lleva
  (`FIELD_LABELS` en `hallazgos-api/src/shared/errors/field-labels.ts`). Los
  campos en listas usan la ruta con índice (`evaluations.1.valve`) y, en el
  resumen, el renglón contado desde 1.
- 500: "Ocurrió un error inesperado… con la referencia E-XXXXXX". En
  OpenObserve se busca la referencia.
- 401 de sesión: `SESSION_EXPIRED`. Contraseña equivocada: `INVALID_CREDENTIALS`.

### En la UI

- `parseApiError(error)` (`app/_services/apiError.ts`): tipo, título,
  mensaje, errores por campo y referencia.
- El interceptor (`axiosWrapper`) muestra el aviso con el título del tipo:
  "Revisa los datos", "Sin permiso", "No encontrado", "Error del servidor"
  (con "Copiar referencia"), "Sin conexión", "Tiempo agotado"…
- **Formularios:** `.catch(failFromApi)` de `useFieldErrors` marca todos los
  campos que el API rechazó y enfoca el primero. Si el formulario nombra
  distinto: `failFromApi(error, { areaId: "area" })` o una función.
- **Sin conexión o tiempo agotado al guardar:** el aviso trae
  "Reintentar", que reenvía la misma petición (mismo FormData con la foto).
  La pantalla sigue esperando y no pierde nada. Solo en peticiones que no
  duplican (con clave de idempotencia o no-POST); las consultas (GET) usan el
  `ErrorState` de las tablas.
- **Tiempos límite:** 90 s con FormData (fotos), 120 s en descargas, 30 s el
  resto.
- **Sesión terminada:** `SessionEndedDialog` (en el layout) avisa una sola vez;
  "Iniciar sesión" borra la cookie y lleva al login.

### Clave de idempotencia

Endpoints con `@Idempotent()` en el API: crear hallazgo, iniciar proceso,
cerrar, cancelar, reasignar, comentar, ICS y entrega de EPP. Con el header
`Idempotency-Key`, un reintento con la misma clave devuelve la respuesta del
primero sin volver a guardar ni mandar correos (tabla `idempotency_key`, 7
días). Sin el header funciona como antes.

```tsx
const submission = useIdempotencyKey(idRow); // alcance opcional
Service.create(formData, { idempotencyKey: submission.key() })
  .then(() => submission.settle())
  .catch(submission.settle);
```

La clave se conserva tras un corte, un tiempo agotado o un 500 (el servidor
quizá lo guardó), y cambia tras guardar, tras un error de datos o al cambiar
el alcance. Cancelar, reasignar y comentar usan una clave por llamada (cubre
"Reintentar").

---

## 4. Módulo Hallazgos (Fase 4)

Archivos en `app/(routes)/hallazgos/`.

- **Tarjetas en celular (C1):** `_components/EvidenceCards.tsx`. En celular
  (< 600 px) la tabla se cambia por tarjetas con ID, estatus
  (`EvidenceStatusChip`), tipo, lugar (con su zona), responsable y plazo.
  La acción principal va a la vista: **Iniciar** si el hallazgo está abierto
  y el usuario puede iniciarlo; si no, **Cerrar** si puede cerrarlo. El
  resto (ver detalles, cerrar, reasignar, cancelar) está en "Más acciones".
  Tocar la tarjeta abre el detalle.
- **Reglas de acciones en un solo lugar:** `useEvidenceActions`
  (`canStart`, `canClose`, `canReassign`, `canCancel`). Son las mismas que
  tenía el menú de la tabla; la tabla y las tarjetas las usan. El API sigue
  validando cada acción.
- **Plazo:** `getDeadline` (en `_constants/priorityOptions.ts`) y
  `EvidenceDeadline`: "Quedan N días" o "Vence hoy", "Vencido" (rojo) con
  hace cuántos días, o "Resuelto en N días" con "En tiempo" / "Fuera de
  tiempo". Misma regla y tonos que la tabla. `getPriorityRiskLevel` da el
  nivel de riesgo para el tono del chip de prioridad en el detalle.
- **Iniciar y cerrar (C4):** a pantalla completa en celular, título con el
  número ("Iniciar hallazgo #N", "Cerrar hallazgo #N") y progreso de subida.
  La confirmación de cierre se cierra al aceptar, para que se vea el progreso
  (antes su spinner lo tapaba). La descripción de la solución ya no aparece en
  rojo al abrir.
- **Nuevo hallazgo (A5):**
  - Sin rojo al abrir. "Crear hallazgo" siempre está activo: al tocarlo se
    marca el primer campo que falta (`useFieldErrors`) y recibe el foco. Antes
    el botón quedaba deshabilitado sin decir qué faltaba.
  - Recuerda la última planta y el último lugar con los que el usuario creó un
    hallazgo en ese dispositivo (`_constants/lastLocation.ts`, `localStorage`
    por id de usuario). Solo se proponen si la planta sigue asignada al
    usuario y el lugar es de esa planta.
  - Descripción con contorno, como el resto de los campos (M8).
  - Progreso de subida y errores del API marcados en su campo.

### Borrador local (C3, opción A)

En crear, iniciar y cerrar hallazgo. Sirve igual para otros formularios de
campo (ICS, EPP).

- **Almacén:** `app/_shared/drafts/draftStore.ts`, IndexedDB nativo (sin
  librería). Base `hallazgos-borradores`, almacén `drafts`, clave
  `{userId}:{formulario}` (`nuevo-hallazgo`, `iniciar:{id}`, `cerrar:{id}`).
  Guarda los campos, la foto como Blob, la clave de idempotencia y el estado
  del último envío. Sin IndexedDB (modo privado), no hace nada.
- **Hook:** `useFormDraft` (`app/_hooks/useFormDraft.ts`) y el aviso
  `DraftNotice`.

```tsx
const draft = useFormDraft<Fields>({
  form: "nuevo-hallazgo",              // null lo desactiva
  content: { fields, photo },
  hasContent: ({ fields, photo }) => !!photo || !!fields.description,
  onRestore: ({ fields, photo }) => { /* poner en el formulario */ },
});

await draft.markSending();             // envío pendiente, con su clave
Service.create(formData, { idempotencyKey: draft.key() })
  .then(() => draft.settle())          // se borra
  .catch(draft.settle);                // solo lectura o editable, según el error

<DraftNotice offer={draft.offer} lock={draft.lock}
  onRestore={draft.restore} onDiscard={…} onRetry={send} />
```

- **Mientras se captura:** se guarda solo (~0.8 s después de cada cambio) si
  hay algo que valga guardar. En "Nuevo hallazgo", la planta y el lugar
  propuestos no cuentan.
- **Al volver a abrir:** "Tienes un borrador (con foto)" con **Recuperar** o
  **Descartar**. Nada se aplica ni se sobrescribe hasta elegir.
- **Envío sin respuesta** (sin conexión, tiempo agotado, en proceso) o error
  500: el borrador queda en **solo lectura** (campos y foto) con **Reintentar
  envío** (misma clave) o **Descartar**. Así una edición nunca se pierde en
  silencio: si el primer envío sí se guardó, el API devolvería ese y no la
  edición. También aplica en la misma pantalla, sin recargar.
- **Resultado del reintento:**
  - Si el API ya lo había procesado (header `Idempotent-Replayed`), se
    avisa "Ya se había guardado (hallazgo #N)" y se borra el borrador.
  - Si se guardó ahora, se muestra el aviso normal y se borra el borrador.
  - Con un error de datos (4xx, incluidos 401 y "sin confirmar"), se puede
    editar y el siguiente envío lleva clave nueva, como siempre.
- **Sesión:** por usuario. Cerrar sesión a propósito avisa y borra los
  borradores del usuario; si la sesión vence, se conservan y el diálogo "Tu
  sesión terminó" dice que lo capturado quedó guardado.
- **Vencimiento:** 7 días desde que se crea el borrador. La clave del API
  también dura 7 días y se crea después (al enviar), así que el borrador
  nunca dura más que su clave. Los vencidos se borran al abrir la app.
- **Se borra** al enviar con éxito.
- `PhotoCapture` e `ImageORCamera` ganaron `readOnly`: muestran la foto sin
  "Quitar foto" ni los botones para cambiarla.

## 5. Módulo EPP (Fase 4)

Archivos en `app/(routes)/epp/`.

- **Firma (A4):** `DialogSignatureEpp`. Sin `width`/`height` en
  `canvasProps`, `react-signature-canvas` ajusta el lienzo a su tamaño en
  pantalla (con la densidad de píxeles del equipo), así que el trazo queda
  bajo el dedo.
  - Ancho completo; en celular vertical, proporción 2.5:1 (`aspect-ratio`,
    como una línea de firma: un recuadro casi cuadrado daba firmas que en el
    Excel se veían muy chicas) y el aviso "Gira el teléfono para firmar con
    más espacio". En horizontal (alto ≤ 500 px), casi todo el alto; en
    escritorio, 320 px.
  - **En el formato de Excel** (`hallazgos-api/src/epps/epp-signature-image.ts`):
    las firmas nuevas caben en la celda con su proporción y quedan
    centradas (desplazamientos en EMU); las anteriores (300 × 200 y 500 × 200
    px) se estiran a 100 × 25 como siempre.
  - Trazo de 1.5 a 3.5 px (antes de 0.5 a 2.5). `touch-action: none` evita
    desplazar la página mientras se firma.
  - **Lo que se guarda** (`_lib/signatureImage.ts`, `exportSignature`): el
    lienzo recortado al trazo (`getTrimmedCanvas`), con 8 px de margen
    transparente y reducido (nunca ampliado) a 600 × 200 px como máximo. Unos
    20–25 KB; a pantalla completa y densidad 3x pesaba hasta ~100 KB, el
    límite de cuerpo del API. Transparente para no tapar los bordes de la
    celda en el formato de Excel.
  - **Fondo blanco solo al mostrarla:** en el lienzo, la vista previa, la
    tabla del historial y las tarjetas (con `object-fit: contain`), para que
    se lea en el tema oscuro.
  - Al girar o cambiar el tamaño, la librería limpia el lienzo; "Guardar" se
    vuelve a deshabilitar hasta que haya trazo.
- **Lista en celular:** `TableEpps` muestra tarjetas (`EppCard`) con nombre,
  cédula, cargo, área, descarga y "Ver historial", que despliega las entregas
  como lista (firma, equipo, fecha, quién entregó y eliminar). La tabla y la
  tarjeta comparten `useEmployeeHistory`. En celular no hay orden por
  columna; los filtros sí aplican.
- **Estados:** sin filas, `TableBodyState` ("Sin entregas de EPP" o "Sin
  resultados") o `ErrorState` con "Reintentar" si la consulta falló.
- **Entrega:** en celular, los equipos agregados en lista (con "Fuera de la
  frecuencia de entrega" como `StatusChip`), la vista previa de la firma al
  ancho disponible y menos margen interior.
- **Sin borrador local:** la idempotencia y "Reintentar" ya cubren el envío
  fallido.

## 6. Módulo Inspección de extintores (Fase 4)

Archivos en `app/(routes)/extinguisher-inspection/`.

- **Formulario (M1):** `FormSection` "Inspección" (planta y próxima recarga,
  que aplica a todas las evaluaciones) y `FormSection` "Evaluaciones", con
  "Agregar evaluación" (escanear el QR) arriba de las tarjetas y
  `FormActions` al pie. En edición, el botón dice "Guardar evaluaciones".
- **Errores:**
  - Al guardar, `useFieldErrors` marca planta, fecha o "Agrega al menos una
    evaluación" junto al campo. `SelectManufacturingPlantsOwn` ganó `error`
    (opcional).
  - Del API: `inspectionApiField` manda `evaluations.N.nextRechargeDate` (y
    `maintenanceDate`) al campo de fecha compartido; `evaluationApiErrors`
    agrupa el resto por evaluación con la etiqueta de la tarjeta
    ("Capacidad: debe ser 1 o mayor."). La tarjeta muestra la alerta, borde
    rojo y la página se desplaza a la primera con error.
- **Teclado:** los datos del extintor vienen del QR y no se escriben; los
  únicos campos de texto son las observaciones (texto libre, máximo 500
  caracteres con contador) y la fecha (selector).
- **Lista:** `ResponsiveTable` (tabla en escritorio, tarjetas en celular)
  con "Inspección #N · fecha" como título, vacío "Sin registros" y error con
  "Reintentar". `ResponsiveColumn` ganó `hideInTable` para columnas que solo
  van en la tarjeta.

---

## 7. Pendiente para otras fases

- **Borrador local** en ICS y EPP, si se decide extenderlo.
- Los borradores de iniciar o cerrar de un hallazgo que ya cambió de estado
  (por ejemplo, cerrado desde otro dispositivo) no se pueden abrir desde la
  lista; se borran a los 7 días o al cerrar sesión.
