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

### `FormActions`

- `inline`: Cancelar y Guardar lado a lado también en celular (para barras
  fijas al pie). Cancelar a su medida y sin ícono en celular; Guardar ocupa
  el resto. Se usa en el registro de Gemba Walk.
- **Alto en pantalla táctil:** 48 px, como pide el tema (A2). Antes su
  `minHeight: 44` le ganaba al tema y los botones de todos los formularios
  medían 44 px también en táctil. Con mouse siguen en 44 px.

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

En crear, iniciar y cerrar hallazgo. También en el recorrido de Gemba Walk
(sección 8) y en el registro de ICS (sección 9).

- **Almacén:** `app/_shared/drafts/draftStore.ts`, IndexedDB nativo (sin
  librería). Base `hallazgos-borradores`, almacén `drafts`, clave
  `{userId}:{formulario}` (`nuevo-hallazgo`, `iniciar:{id}`, `cerrar:{id}`).
  Guarda los campos, la foto como Blob, la clave de idempotencia y el estado
  del último envío. Sin IndexedDB (modo privado), no hace nada. ICS usa la
  clave `{userId}:ics`.
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

await draft.flush();                   // antes de salir: guarda ya lo último
```

- **`flush()`** (desde ICS): guarda en ese momento lo capturado, sin esperar
  los ~0.8 s del guardado automático (que se cancela al salir de la
  pantalla). No pisa un borrador que se está ofreciendo ni uno en solo
  lectura. Úsalo antes de navegar cuando un aviso promete que lo capturado
  quedó guardado.

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
- **Sin almacén de borradores** (sin IndexedDB: modo privado de algunos
  navegadores o datos del sitio bloqueados): `isDraftStorageAvailable()` en
  `draftStore.ts`. Ningún aviso promete que lo capturado quedó guardado: "Tu
  sesión terminó" dice "Este navegador no permite guardar borradores (por
  ejemplo, en modo privado): lo que capturaste en esta pantalla se perderá."
  Aplica a toda la app (Hallazgos: crear, iniciar y cerrar; recorrido de
  Gemba Walk; registro de ICS).
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

## 7. Módulo CIAEL (Fase 4)

Archivos en `app/(routes)/ciael/`.

- **Secciones (A6):** el diálogo a pantalla completa se divide con
  `FormSection` en Evento, Colaborador, Lesión, Causas y Responsables, con
  `FormActions` al pie (antes, "Guardar" estaba en la barra de arriba y con
  `autoFocus`). Lo que depende de la planta (zona, colaborador, cargo,
  máquina, tarea) y de la zona (líder de área) queda deshabilitado hasta
  elegirla, con "Cargando…" mientras llega el catálogo.
- **Dependencias:** al cambiar la planta se limpian zona, colaborador, cargo,
  máquina, tarea y líder de área; al cambiar la zona, el líder de área
  (`changeCiaelField` en `components/ciaelForm.ts`). Si alguno ya estaba
  elegido, un aviso dice cuáles hay que volver a elegir ("Vuelve a elegir
  zona y colaborador: dependen de la planta."). Antes se conservaban y se
  podía guardar, por ejemplo, un colaborador de otra planta.
- **Errores:**
  - "Guardar" nunca está deshabilitado. Al tocarlo se marcan **todos** los
    obligatorios que faltan, junto a su campo, y el foco va al primero
    (`REQUIRED_FIELDS` y `missingCiaelFields` en `components/ciaelForm.ts`, en
    el orden de la pantalla). Aviso: "Completa los N campos marcados." o, si
    falta uno, su mensaje.
  - Cada marca se quita al llenar su campo; las demás siguen.
  - Del API, `failFromApi` con `ciaelApiField` (sin cambios).
- **`useFieldErrors` ganó:**
  - `failAll(campos)`: marca varios campos a la vez y devuelve si marcó algo.
  - `useFormFieldErrors(form)`: misma API, pero con el formulario en un objeto,
    cada error se quita al cambiar **su** campo. `useFieldErrors` sigue igual
    (cualquier cambio quita todos los errores) para los demás formularios.
- **Descartar:** cerrar (X, Esc o "Cancelar") con algo capturado pide
  confirmar ("¿Descartar el registro?", con "Seguir editando"). Vacío, se
  cierra directo.
- **Teclado:** días de incapacidad y horas laboradas abren el teclado numérico
  (`inputMode="numeric"`, solo dígitos, como antes). Descripción con contorno
  (M8). El resto son listas.
- **Lista:** `ResponsiveTable` (tarjetas en celular con "Tipo · fecha" de
  título, colaborador, diagnóstico, zona con área y quién reportó), vacío
  "Sin registros CIAEL" y error con "Reintentar".
- **Sin `Stepper`:** se evaluó para celular y no se implementó. Los errores
  del API pueden caer en cualquier paso (habría que saltar entre pasos para
  mostrarlos), el registro se revisa completo antes de guardar, y con las
  secciones y "marcar todo lo que falta" ya se ve qué completar. Si se
  quisiera, la opción de bajo costo es un índice de secciones con su
  conteo de pendientes, no un asistente por pasos.
- **Sin borrador local:** CIAEL lo captura un administrador en escritorio; la
  confirmación al descartar cubre el cierre por error.

## 8. Módulo Gemba Walk (Fase 4)

Archivos en `app/(routes)/gemba-walk/`. Revisión y prioridades en
`docs/ux-auditoria.md` (sección 2, "Gemba Walk").

### Registrar recorrido (`/form`)

- **Borrador local (G1):** `useFormDraft` con el formulario `gemba-walk` (uno
  por usuario y dispositivo). Se guarda solo un recorrido **iniciado**: planta,
  evento (hora, zona y ubicación), comprobante de inicio con su hora y las
  respuestas. Reglas en `form/_lib/walkDraft.ts`.
  - Al recuperarlo, el recorrido sigue iniciado con su **hora de inicio
    original y su comprobante**, aunque haya pasado la tolerancia de 15
    minutos. La tolerancia no cambió: el API la valida al iniciar y la revisa
    otra vez al registrar con la hora de inicio del comprobante, no con la de
    registro.
  - **Ya no se puede registrar** (`blockedReason`): otro día ("Era un
    recorrido del DD/MM/AAAA…"), comprobante con más de 24 horas, o el evento
    ya no está entre los disponibles ("ya se registró, desde otro dispositivo
    o por otro observador"). Queda en solo lectura con el motivo y
    "Descartar recorrido". Si no se pudieron consultar los disponibles (sin
    señal), no se bloquea: decide el API al registrar.
  - Si un registro falla con un error de datos, se vuelven a consultar los
    disponibles: si otro observador lo registró, aparece el motivo.
  - **La duración de un recorrido recuperado incluye el tiempo que estuvo
    interrumpido:** el API la calcula de la hora de inicio del comprobante a
    la hora de registro. La duración solo se muestra en la lista y en el
    detalle del recorrido; ningún Excel, dashboard ni indicador la usa.
  - La planta y el evento no se pueden cambiar con un recorrido iniciado
    (`SelectManufacturingPlantsOwn` ganó `disabled`).
- **Idempotencia (G3):** `POST /gemba-walk/walks` tiene `@Idempotent()`.
  Como en Hallazgos: `draft.markSending()`, la clave del borrador
  (`draft.key()`) y `draft.settle()`. Un envío sin respuesta deja el borrador
  en solo lectura con "Reintentar envío"; si ya se había registrado, "Ya se
  había registrado (recorrido #N)". `GembaWalksService.create` devuelve
  `{ data, replayed }`; `submitResult` y `SubmitResult` pasaron a
  `axiosWrapper` (los usan Hallazgos y Gemba Walk).
- **Salir (G3):** "Cancelar" con un recorrido iniciado pregunta "¿Salir del
  recorrido?": lo capturado queda en el borrador para retomarlo hoy. Sin
  almacén de borradores (modo privado), el aviso dice que lo capturado se
  perderá y "Salir" va en rojo. Al confirmar "Salir" se guarda en ese momento
  lo último capturado (`draft.flush()`): antes, si se confirmaba menos de
  ~0.8 s después del último cambio, ese cambio no alcanzaba a guardarse.
- **Cumple / No cumple (G4):** dos botones (`ToggleButtonGroup`, nombrado
  con el concepto) en lugar de "NC · switch · C · chip". A ancho completo en
  celular.
- **Barra fija al pie (G4, G9):** conteo C/NC y `FormActions` ("Terminar
  recorrido" y "Cancelar") siempre a la vista. El `sticky` va en el `Grid`,
  no en el `Paper`: dentro de su propio `Grid` no tiene espacio para quedarse
  fijo. Los botones van lado a lado también en celular (`FormActions`
  `inline`): unos 115 px de alto en lugar de ~170 px. Revisado a 360 px: el
  texto cabe completo y miden 48 px en pantalla táctil.
- **Error de carga:** si no cargan los eventos o los conceptos, `ErrorState`
  con "Reintentar" (sin perder un borrador recuperado).
- Títulos de categoría con `text.brand` (G9).

### Lista, detalle y agenda

- **Lista (G2):** `ResponsiveTable`. En celular, tarjetas con "Zona -
  Ubicación", planta, fechas, duración, C/NC, porcentaje, observador y "Ver".
- **Detalle (G5):** "Recorrido no encontrado" (sin id o 404) y `ErrorState`
  con "Reintentar" si falla (antes, barra de carga para siempre). "Regresar"
  secundario y categorías con `text.brand` (G9).
- **Agenda (G6):** en celular, vista de lista por semana
  (`@fullcalendar/list` 6.1.21, misma versión que los demás paquetes de
  FullCalendar) con "Sin recorridos programados esta semana." si no hay. En
  tablet y escritorio, mes y semana como antes. "Regresar" secundario (G9).
- **Calendario (G7):** en pantalla táctil, mantener presionado 350 ms (antes
  1 s, el valor de FullCalendar) para elegir días o mover eventos; el texto
  de ayuda lo explica.
- **Pendiente (G8):** las tablas de zonas, observadores, conceptos y
  calendario siguen desplazándose de lado en celular. Se harán con el panel
  administrativo.

## 9. Módulo ICS (Fase 4)

Archivos en `app/(routes)/ics/`.

### Registro (`/form`)

- **Borrador local (C3):** `useFormDraft` con el formulario `ics`, igual que
  "Nuevo hallazgo": campos y foto se guardan solos mientras se captura; al
  volver, "Recuperar" o "Descartar"; un envío sin respuesta o un 500 deja el
  borrador en **solo lectura** con "Reintentar envío" (misma clave de
  idempotencia) y, si ya había llegado, "Ya se había guardado (ICS #N)".
  `IcsService.create` devuelve `{ data, replayed }` (`submitResult`). En
  edición (`?id=`) no hay borrador.
  - La planta sola no cuenta como captura (es lo primero que se elige).
  - **Campos dependientes:** al cambiar la regla de vida se limpian estándar
    y área; al cambiar el estándar, el área; al cambiar la planta, las
    personas que no cumplen (`changeField`). Antes lo hacían efectos que
    también borraban el estándar y el área al recuperar un borrador.
- **Guardar (marca todo):** nunca está deshabilitado (antes sí, sin decir qué
  faltaba). Con `useFormFieldErrors` y `failAll` marca a la vez planta,
  regla de vida, personas totales y personas que no cumplen, junto a cada
  campo, y enfoca el primero. "Personas totales" menor que las personas que
  no cumplen se marca en su campo (antes, solo un aviso). Misma regla que
  antes; el API la sigue validando.
- **Errores del API** por campo con `failFromApi` (`icsApiField`:
  `ruleOfLifeId` → regla de vida, `employeesIds.N` → personas que no
  cumplen…). La foto (`file`) queda en el aviso.
- **Salir:** "Cancelar" con algo capturado pregunta "¿Salir del registro?":
  lo capturado queda en el borrador (se guarda en ese momento con
  `draft.flush()`, como en Gemba Walk). Sin almacén de borradores (modo
  privado), el aviso dice que se perderá y "Salir" va en rojo. Con un envío sin confirmar ya
  guardado, sale directo. Vacío (o solo con la planta), sale directo.
- **Teclado (B1):** "Personas totales" con `inputMode="numeric"` y
  `pattern="[0-9]*"`, solo enteros desde 1 (antes `type="number"` con teclas
  bloqueadas). Es el único campo numérico de ICS.
- **Carga y error:** regla de vida con "Cargando…" en el campo; si el
  catálogo o los colaboradores no cargan, `ErrorState` chico en su lugar con
  "Reintentar". Los colaboradores usan `useCatalog("employees")` (la misma
  caché que CIAEL).
- **Personas que no cumplen:** el campo siempre está; deshabilitado hasta
  elegir planta ("Elige una planta para ver a sus colaboradores.") y "Esta
  planta no tiene colaboradores activos." si no hay. Antes era un párrafo
  suelto. La etiqueta pasó a "Personas que no cumplen *": la anterior se
  cortaba a 390 px.
- Descripción con contorno (M8), foto con `PhotoCapture` (progreso de subida
  y solo lectura con un envío pendiente). "Estándar de comportamiento" (con
  acento) y "Área" sin asterisco: nunca fueron obligatorios ni en la UI ni en
  el API.

### Lista

- `ResponsiveTable`: en celular, tarjetas con "ICS #N · porcentaje" de
  título, planta, regla de vida, estándar, área, personas totales,
  "Cumplen / No cumplen" y "Eliminar". En escritorio, las mismas columnas de
  siempre. Vacío "Sin registros de ICS" y error con "Reintentar".

---

## 10. Dashboards (Fase 4)

Archivos en `app/(routes)/dashboard/` y
`app/(routes)/business-intelligence/epp/`.

### Al entrar (M5)

- **Planta propuesta:** `proposedPlantId` (`app/_shared/utils/lastPlant.ts`):
  la única planta del usuario o, si tiene varias, la última que eligió **en
  esa pantalla** en ese dispositivo (`localStorage` por usuario y pantalla:
  `dashboard` o `bi-epp`), solo si todavía la tiene asignada. Se guarda al
  elegir una planta.
  - Dashboard: sin planta clara (varias y ninguna elegida antes), pide
    elegirla. Con una sola, el selector ya la elegía solo.
  - Análisis de datos EPP: la planta es obligatoria; sin planta clara usa la
    primera, como antes.
- **Periodo por omisión: los últimos 30 días** (hoy y los 29 anteriores) en
  ambos tableros. Antes era el mes en curso: el día 1 solo había un día de
  datos y los primeros días del mes casi todo salía vacío. En EPP es el
  atajo nuevo "Últimos 30 días" (primero de la lista); la API lo compara con
  los 30 días previos (cualquier rango que no empieza en día 1 se compara con
  el periodo anterior de igual duración). Los demás atajos no cambian.

### Un solo estado para la pantalla

- **Dashboard:** `useDashboardSummary` (React Query) pide
  `status-by-filters`; lo comparten la página y la gráfica de estatus (una
  sola petición, como antes). Según el resultado, en lugar de las gráficas
  se ve un solo aviso:
  - "Elige una planta" o "Elige el periodo" (con "Ver los últimos 90 días").
  - Cargando: dos bloques de skeleton, solo la primera vez. Al cambiar un
    filtro se conservan las gráficas hasta tener el nuevo resultado
    (`keepPreviousData`).
  - Sin hallazgos: "Sin hallazgos en este periodo", con "Quitar zonas,
    responsables y clasificación" (si hay) y "Ver los últimos 90 días".
  - Error: `ErrorState` con "Reintentar" (y "Sin conexión" sin red).
  - Las gráficas se montan solo con datos: sin ellas no hacen sus 10
    consultas. Antes, cada una decía "Seleccione planta, fecha inicio y fecha
    fin" o quedaba vacía.
  - "Descargar informe PDF" aparece solo con gráficas en pantalla
    (`canDownloadPdf`).
- **EPP:** sin entregas en el periodo, "Sin entregas de EPP en este periodo"
  (con "Ver los últimos 3 meses") en lugar de las pestañas con "Sin datos"
  en cada gráfica; los indicadores se quedan, porque comparan con el periodo
  anterior. Si falla la consulta, `ErrorState` con "Reintentar": antes la
  pantalla se quedaba en carga para siempre.

### Celular

- **Filtros del dashboard:** la barra es fija (`sticky`) solo desde
  escritorio (`md`). En celular y tablet, abierta ocupaba toda la pantalla y
  cerrada tapaba las gráficas al bajar.
- **Donas** (estatus, zona y clasificación): `donutResponsive` en
  `charts/donutResponsive.ts`. Con menos de 500 px de ancho de gráfica, sin
  etiquetas afuera (encogían la dona y se cortaban: "Incumplimi…"); la
  leyenda lleva nombre, cantidad y porcentaje y, con muchas opciones,
  pagina con flechas (máximo 120 px de alto). Aplica también a la dona de
  clasificación en escritorio, cuya tarjeta es angosta.
- **EPP:** indicadores de dos en dos en celular y tablet (uno por renglón
  obligaba a bajar unos 600 px antes de la primera gráfica); el "vs …" de la
  comparación baja de renglón en lugar de cortarse.
- Revisado a 390 px: nada se desplaza de lado en ninguno de los dos.

### Informe PDF

Sin cambios en cómo se genera (`html2canvas` + `jsPDF`, las gráficas en
pantalla, 2 por página). Revisado: se descarga un PDF válido con todas las
gráficas; la prueba e2e ahora valida el archivo y el número de páginas.

---

## 11. Panel administrativo (Fase 4)

Inventario y grupos aprobados: (1) base común y Procesos como piloto, (2)
General, (3) criterios, equipos y HDS, (4) configuración de Gemba Walk (G8).

### Base común (grupo 1)

- **"Guardar" marca todo lo que falta:** `useFormFieldErrors` + `failAll`,
  como en CIAEL e ICS. Ya no se usa `isSaveDisabled` para campos
  obligatorios.
- **Confirmar al salir:** `useLeaveConfirm(form, { isEditing,
  ignoreOnCreate })` (`app/_hooks/useLeaveConfirm.ts`).
  - "Algo capturado": al crear, cualquier cambio respecto al formulario
    vacío; al editar, respecto a lo cargado (`markPristine(loaded)`), así que
    volver al valor original ya no pregunta.
  - `ignoreOnCreate`: campos que no cuentan al crear (p. ej. la planta que se
    elige sola cuando el usuario tiene una).
  - `go(href)` navega y, con cambios, pregunta "¿Descartar el registro?" (al
    crear) o "¿Descartar los cambios?" (al editar), con "Seguir editando". Lo
    usan "Cancelar" y el enlace de la lista en los breadcrumbs. Guardar
    navega directo.
  - Como en los demás módulos, el menú lateral y el botón "atrás" del
    navegador no preguntan.
- **Registro en edición:** `useEditRecord(id, Service.findOne, onLoad)`
  (`app/_hooks/useEditRecord.ts`) y `EditRecordState`
  (`app/_shared/components/EditRecordState.tsx`). Mientras carga,
  `FormSkeleton` (antes se veía el formulario vacío y lo que se escribiera se
  pisaba al llegar los datos); con 404, "Proceso no encontrado" y "Volver a
  la lista"; con otro error, `ErrorState` con "Reintentar" (antes quedaba
  vacío sin aviso). El id se lee de la URL al renderizar (antes, un estado
  que se llenaba en un efecto).
- **Breadcrumbs (B2):** `PageHeader` ganó `breadcrumbs` y `onNavigate`;
  `PageBreadcrumbs` (MUI `Breadcrumbs`, sin librería) arma la ruta con
  `breadcrumbTrail(pathname)` de `menu.tsx`: sección › subgrupo › lista ›
  título de la página. El subgrupo se omite si es "General" o si se llama
  igual que la lista. Sección y subgrupo son texto; la lista, un enlace (con
  `onNavigate`, pasa por la confirmación). La última miga lleva
  `aria-current="page"`. Solo desde 600 px (tablet y escritorio). Ejemplos:
  "Configuración › Procesos › Editar proceso", "Configuración › Gemba Walk ›
  Zonas › Nueva zona".
- **Teclados (B1):** `NUMERIC_INPUT` (enteros) y `DECIMAL_INPUT` (precio,
  capacidad) en `app/_shared/utils/inputModes.ts`. CIAEL e ICS usan el
  compartido (antes, cada uno el suyo).

### Procesos (piloto)

- Formulario: nombre y planta, "Guardar" marca ambos ("Escribe el nombre.",
  "Selecciona la planta."), confirmación al salir, carga del registro con
  sus estados y breadcrumbs.
- Lista: `ResponsiveTable` con nombre de título y planta de subtítulo en
  celular; vacío "Sin registros de procesos".
- API: "Proceso #N no encontrado" (antes "Proceso con ID N no encontrado").

---

## 12. Pendiente para otras fases

- Los borradores de iniciar o cerrar de un hallazgo que ya cambió de estado
  (por ejemplo, cerrado desde otro dispositivo) no se pueden abrir desde la
  lista; se borran a los 7 días o al cerrar sesión.
