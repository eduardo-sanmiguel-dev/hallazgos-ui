# Auditoría de UX — Sistema EHS de Hada International

Fase 1 del plan de mejora de UX. Solo diagnóstico: no se modificó código.

## Cómo se hizo

- Revisión del código de la UI (Next.js App Router + MUI) y del API (NestJS) que
  alimenta cada pantalla.
- Capturas reales de 19 pantallas representativas en celular (390 px), tablet
  (820 px) y escritorio (1440 px).
- Datos de producción: tamaño y resolución de las 914 evidencias subidas desde julio
  de 2026, y tiempos de usuarios reales (RUM en OpenObserve).
- Lo que es **medido** se indica con cifras. Lo que es **estimación** (esfuerzo,
  impacto) se marca como tal.

**Ya corregido antes de esta auditoría** (no se repite abajo): botones de cabecera
uniformes en celular, paginación que no se corta, filas de tabla más compactas en
celular y tablet, campos de filtro con el mismo estilo, meses en español en CIAEL y
Colaboradores, y optimización de catálogos (usuarios, colaboradores, zonas,
supervisores).

---

## Resumen ejecutivo

Los cinco problemas que más afectan el trabajo diario:

1. **En celular, el estado y las acciones de un hallazgo quedan fuera de la
   pantalla.** La tabla tiene unas 14 columnas: para ver si un hallazgo está abierto
   o cerrado, o para iniciarlo o cerrarlo, hay que desplazarse de lado.
2. **Las fotos de la cámara del navegador salen en muy baja resolución** (por
   ejemplo, 385 × 540 y 264 × 682 px). Las fotos adjuntas desde la galería llegan
   bien (900 × 1600 o más). La evidencia es lo más importante de un hallazgo.
3. **Si se pierde la señal o se cierra la pantalla, se pierde todo lo capturado.** No
   hay borradores, ni reintento, ni aviso de "sin conexión".
4. **Los errores del API llegan en inglés y sin decir qué campo falló.** De 570
   validaciones en el API, solo 12 tienen mensaje propio en español.
5. **Áreas táctiles chicas y contraste bajo para uso en exteriores.** Los botones
   miden unos 36 px (mínimo recomendado: 48 px) y el texto verde de marca sobre
   blanco tiene contraste 2.27:1 (mínimo AA: 4.5:1).

---

## 1. Mapa de la app

**Tipo:** C = captura en campo · A = administración · N = análisis.

**Acceso:** según el menú (`app/_shared/components/menu.tsx`). La columna "Validación
en la página" indica si la propia página bloquea a quien no tiene acceso (si no, solo
se oculta del menú y el API decide).

| Ruta | Módulo | Tipo | Quién la ve en el menú | Validación en la página |
| --- | --- | --- | --- | --- |
| `/dashboard` | Dashboard de hallazgos | N | Todos (un usuario restringido ve menos clasificaciones) | Parcial (usuario de HDS → `/hds`) |
| `/business-intelligence/epp` | Análisis de datos EPP | N | Administrador | Sí |
| `/hallazgos`, `/hallazgos/form` | Hallazgos | C | Todos | — |
| `/ics`, `/ics/form` | Comportamiento seguro (ICS) | C | Administrador | No |
| `/gemba-walk` y `/form`, `/view`, `/schedule` | Gemba Walk | C | Observadores y administradores | Sí (`GembaWalkAccessGuard`) |
| `/extinguisher-inspection` y `/form` | Inspección de extintores | C | Administrador y correos con acceso a EPP | No |
| `/ciael` | CIAEL (accidentes) | C | Administrador | No |
| `/epp` | Entregas de EPP | C | Administrador y correos con acceso a EPP | No |
| `/hds` | Hojas de datos de seguridad | A (consulta) | Todos excepto usuarios solo-EPP | — |
| `/users`, `/users/form` | Usuarios | A | Administrador | Solo el formulario |
| `/employees` y `/form` | Colaboradores | A | Administrador | No |
| `/manufacturing-plants`, `/zones`, `/areas`, `/processes` (+ `/form`) | Plantas, lugares, zonas, procesos | A | Administrador | No |
| `/main-types`, `/secondary-types` (+ `/form`) | Criterios y tipos | A | Administrador | No |
| `/equipments`, `/emergency-teams` (+ `/form`) | Equipos de protección y de emergencia | A | Administrador | No |
| `/gemba-walk/zones`, `/observers`, `/calendar`, `/evaluations` (+ `/form`) | Configuración de Gemba Walk | A | Administrador | Sí (guardia de Gemba Walk) |

Notas:

- Hay reglas por **correo** además de por rol: usuarios solo-EPP, un usuario solo-HDS
  y un dashboard restringido.
- No hay `loading.tsx` en ninguna ruta y solo hay un `error.tsx`, el de
  `app/(routes)`.

---

## 2. Hallazgos priorizados

Formato: **ID · Pantalla** — problema → impacto → propuesta. Entre corchetes, el
esfuerzo estimado: S (horas), M (1–2 días), L (3+ días).

### Crítico

**C1 · Lista de hallazgos (celular)** — Con unas 14 columnas, el estatus, los
responsables y el botón de acciones quedan a la derecha, fuera de la pantalla.
→ En campo no se ve de un vistazo qué está abierto ni qué hacer con él; hay que
desplazarse de lado en cada fila. → En celular, mostrar **tarjetas**: ID, estatus con
color, lugar, tipo, responsable, días restantes, y la acción principal visible
(Iniciar o Cerrar). La tabla se queda en tablet y escritorio. [L]

**C2 · Evidencia con cámara (Hallazgos: crear, iniciar, cerrar; ICS)** — La cámara
del navegador (`react-html5-camera-photo`) guarda la foto al tamaño del visor:
medimos capturas de 385 × 540, 264 × 682 y 1046 × 738 px. Las fotos de galería
llegan a 900 × 1600 o 1368 × 1824. → La evidencia sale borrosa y no sirve para
auditoría. → Usar la **cámara nativa del teléfono** con
`<input type="file" accept="image/*" capture="environment">` (mejor enfoque, flash y
resolución) y comprimir antes de subir con `browser-image-compression`, que ya está
instalada. Mantener la cámara del navegador solo como alternativa. [M]

**C3 · Captura sin conexión o con señal mala (todos los formularios de campo)** — No
hay borradores, reintentos, tiempo límite en las peticiones ni aviso de "sin
conexión". Si falla el envío o se cierra la pestaña, se pierde lo capturado, foto
incluida. → Retrabajo y hallazgos que no se registran. → Ver la sección
"Conectividad" (propuesta: borrador local por formulario). [M–L]

**C4 · Cerrar e iniciar un hallazgo (diálogos)** — Cerrar es irreversible y no pide
confirmación. Además, los diálogos no se abren a pantalla completa en celular
(`maxWidth={false}` sin `fullScreen`). → Riesgo de cerrar por error, y en celular el
diálogo queda apretado con la cámara adentro. → Confirmación breve al cerrar, con un
resumen de foto y descripción, y diálogos a pantalla completa en celular. [S]

### Alto

**A1 · Errores del API** — `handleErrorResponse` muestra `data.message` tal cual. En
errores de validación, NestJS manda un **arreglo** de textos en inglés de
class-validator (solo 12 de 570 validaciones tienen mensaje propio), sin indicar el
campo. Sin conexión se ve el mensaje genérico. Todos los errores se titulan
"¡ Atención !". → El usuario no sabe qué corregir. → Fase 3: formato único de error
(mensaje en español, código, errores por campo), conectarlo con el `useFieldErrors`
que ya existe y distinguir "sin conexión" con la acción "Reintentar". [M]

**A2 · Áreas táctiles (toda la app)** — El tema no ajusta tamaños: los botones miden
unos 36 px y los botones de ícono pequeños (acciones de tabla) unos 34 px. →
Difícil acertar con guantes o de pie. → En el tema: botones de al menos 44–48 px en
celular y botones de ícono de 48 px en las acciones de tablas y tarjetas. [S]

**A3 · Contraste** — El verde de marca `#71BF44` como texto sobre blanco (botones con
contorno, enlaces, chips de filtros) tiene 2.27:1; el naranja de advertencia de MUI
`#ED6C02` tiene 3.11:1. El botón relleno (texto oscuro sobre verde) sí cumple con
7.66:1. → Al sol esos textos casi no se leen. → Usar un verde más oscuro solo para
texto e íconos sobre fondo claro (ya existe `primaryTextColor` para encabezados de
tabla) y revisar los colores de advertencia. [S]

**A4 · Firma en entregas de EPP** — El lienzo mide 300 × 200 px en celular aunque el
diálogo ocupa toda la pantalla. Además **se puede guardar una firma vacía**:
`saveSignature` no verifica `isEmpty()`. → Firmas ilegibles o en blanco en un
registro que debe tener validez. → Lienzo que ocupe el ancho disponible (y aproveche
la orientación horizontal), botón "Guardar" deshabilitado mientras no haya trazo, y
"Limpiar" visible. [S]

**A5 · Formulario de nuevo hallazgo** — Tiene 9 campos y todos aparecen en rojo de
error desde que se abre, antes de que el usuario haga algo. El texto de la
descripción dice siempre "…del comportamiento inseguro", aunque la clasificación sea
otra. No se recuerda la última planta, lugar o proceso usado. → Sensación de error
constante y más toques de los necesarios. → Mostrar errores solo al intentar guardar
(usando `useFieldErrors`, como en otros formularios), texto neutro ("Describe lo que
observaste"), y recordar la última planta y el último lugar del usuario en ese
dispositivo. [M]

**A6 · CIAEL** — Son 25 campos en un solo diálogo, sin secciones. → Formulario largo
y fácil de dejar a medias. → Agruparlos en secciones (Evento, Colaborador, Lesión,
Causas) con `FormSection` o un `Stepper` en celular. [M]

**A7 · Estados de carga** — 23 pantallas usan una barra lineal (`LoadingLinear`) y
solo 5 usan skeletons. No hay `loading.tsx`. → Saltos de diseño y la sensación de
"no carga". → Skeletons por tipo de pantalla (lista, formulario, dashboard) y
`loading.tsx` en las rutas principales. [M]

**A8 · Navegación en celular** — Para crear un hallazgo desde otra pantalla hay que
abrir el menú lateral, ir a Hallazgos y tocar "Crear". No hay acceso directo a las
acciones de campo. → Más pasos en la tarea más frecuente. → Navegación inferior en
celular con 3–4 accesos según el rol (Hallazgos, Nuevo hallazgo, Gemba Walk, EPP). [M]

### Medio

**M1 · Inspección de extintores (formulario)** — El orden de botones confunde: "Crear
evaluación", luego "Cancelar" y al final "Guardar". → Se toca "Cancelar" por error. →
Agregar evaluación arriba y, al pie, "Guardar" como principal y "Cancelar" como
secundario, igual que en el resto de formularios. [S]

**M2 · Botones de evidencia (Hallazgos, ICS)** — "Capturar evidencia | Adjuntar
imagen" es un `ButtonGroup` que en celular se aprieta en dos líneas. La vista previa
del adjunto usa una cuadrícula de `minmax(400px, …)`, más ancha que un celular de
390 px. Si la compresión falla, solo se registra en consola y el usuario no se
entera. → Botones apilados a ancho completo, vista previa adaptable y mensaje claro si
la imagen no se pudo procesar. [S]

**M3 · Sin progreso de subida** — Al guardar con foto solo se ve un spinner. Con mala
señal puede tardar sin dar señales de avance. → `onUploadProgress` de axios para una
barra de progreso y tiempo límite con opción de reintentar. [S]

**M4 · ICS: errores al guardar** — *Corregido.* La auditoría marcó que "Guardar" no
tenía estado de carga, pero fue un falso positivo: sí lo tiene, por medio de
`FormActions` (`isSaving`). El problema real era otro: si el API rechazaba el
registro, no se mostraba ningún mensaje, porque `IcsService.create` usa axios
directo sin el interceptor de errores y la pantalla no tenía `.catch`.

**M5 · Dashboard en celular** — Si el usuario tiene varias plantas, entra sin planta
seleccionada y ve todas las gráficas vacías con "Seleccione planta, fecha inicio y
fecha fin". → Primera impresión de "no funciona". → Preseleccionar la planta (la
única, o la última usada) y un estado vacío único en lugar de uno por gráfica. [S]

**M6 · Tablas del panel administrativo (celular)** — Se desplazan de lado, y los
nombres y correos se parten en 2–3 líneas (por ejemplo, en Usuarios). → Uso incómodo
en celular, aunque es menos frecuente. → Componente `ResponsiveTable`: tabla en
escritorio y tarjetas en celular, empezando por Usuarios y Colaboradores. [M]

**M7 · Estados vacío, sin permisos y error** — Ya existe un componente `EmptyState`,
pero solo lo usan 4 pantallas (CIAEL, equipos de emergencia y dos de Análisis de datos
EPP), y EPP tiene su propio mensaje. Las demás tablas, de 25 en total, muestran solo
los encabezados cuando no hay datos. "Sin permisos" solo existe en Gemba Walk. →
Ambigüedad: ¿no hay datos o falló? → Usar `EmptyState` en todas las tablas y agregar
`ErrorState` y `NoAccessState` con el mismo estilo. [M]

**M8 · Consistencia de componentes** — En el formulario de hallazgo, la descripción
usa un `TextField` estándar dentro de un `Paper` mientras el resto son campos con
contorno. Los títulos de los avisos llevan espacios ("¡ Correcto !"). Hay estilos
sueltos (`style={{…}}`) en componentes compartidos. → Aspecto poco pulido. → Unificar
en el tema y en componentes base. [S]

### Bajo

**B1 · Teclados por tipo de campo** — Solo 4 campos usan `inputMode` y 6 usan
`type="number|tel|email"`. Por ejemplo, "Personas totales" (ICS) y los códigos de
colaborador deberían abrir el teclado numérico. [S]

**B2 · Breadcrumbs** — Los formularios y los detalles no indican de dónde vienen. En
escritorio ayudaría una ruta corta ("Configuración › Lugares › Editar"). [S]

**B3 · Indicador de Next.js** — La burbuja redonda de abajo a la izquierda que se ve
en desarrollo es el indicador de Next.js. No existe en producción, así que no
requiere cambios.

---

## 3. Quick wins (poco esfuerzo, mucho impacto)

| # | Cambio | Resuelve | Esfuerzo |
| --- | --- | --- | --- |
| 1 | Cámara nativa (`capture="environment"`) + compresión con la librería ya instalada | C2 | Medio día |
| 2 | Confirmación al cerrar un hallazgo y diálogos a pantalla completa en celular | C4 | Medio día |
| 3 | Firma: lienzo a todo el ancho y no permitir guardar vacía | A4 | Medio día |
| 4 | Tema: botones de al menos 44–48 px y verde oscuro para texto | A2, A3 | 1 día |
| 5 | Formulario de hallazgo: errores al guardar, texto neutro de descripción | A5 (parte) | Medio día |
| 6 | Orden de botones en extintores | M1 | 1 hora |
| 7 | Progreso de subida y tiempo límite con "Reintentar" | M3 | Medio día |
| 8 | Dashboard con planta preseleccionada | M5 | 2 horas |

---

## 4. Conectividad: opciones evaluadas (no implementadas)

**Hoy:** la PWA se puede instalar, pero no tiene service worker. Sin red no carga y
lo capturado se pierde.

| Opción | Qué resuelve | Costo estimado | Riesgos |
| --- | --- | --- | --- |
| **A. Borrador local por formulario** (IndexedDB, foto incluida) y botón "Reintentar envío" | No se pierde lo capturado si falla el envío, se recarga la página o se cierra la app | 3–5 días | Bajo. La foto ocupa espacio en el dispositivo (se borra al enviar) |
| **B. Cola offline** (service worker + reintento automático al volver la señal) | Se puede capturar sin señal y se envía solo después | 2–3 semanas | Medio-alto. iOS no soporta Background Sync, hay que resolver datos duplicados y catálogos sin conexión, y se depende del ciclo del service worker |

**Recomendación:** la opción A primero, porque cubre el caso más común (señal mala
justo al guardar) con poco riesgo. La B solo si después se confirma que hay zonas de
planta sin señal.

---

## 5. Problemas fuera del alcance de UX (solo se reportan)

Por regla del plan, no se modifican.

1. **Validación de evidencia en el formulario de hallazgo.** `validateUnsafeBehavior`
   marca "comportamiento inseguro" (que no exige foto), pero **nunca lo desmarca**.
   Si se elige esa clasificación y luego se cambia a otra, el formulario deja de
   exigir la evidencia. Falta confirmar si el API lo valida por su cuenta.
2. **Acceso por URL directa.** Varias pantallas administrativas solo se ocultan del
   menú; la propia página no bloquea a quien entra por URL. El API sí protege las
   escrituras, pero un usuario sin permiso podría ver pantallas vacías o con errores
   en lugar de un "sin acceso". Conviene revisar qué consultas de lectura son
   visibles por rol.
3. **Aviso de `pg`** al guardar entidades con relaciones muchos a muchos. Es interno
   de TypeORM, no afecta hoy y ya está documentado.

---

## 6. Plan propuesto para las siguientes fases (por impacto)

### Fase 2 — Base común

1. **Tema:**
   - Áreas táctiles y contraste (A2, A3).
   - Colores semánticos por estado de hallazgo y por nivel de riesgo, que hoy viven
     en la tabla.
2. **Componentes:**
   - `PhotoCapture` (C2, M2, M3).
   - `StatusChip`.
   - `ResponsiveTable` (C1, M6).
   - `EmptyState` (ya existe: extender su uso), `ErrorState` y `NoAccessState` (M7).
   - Skeletons (A7).
   - `FormSection` (A6).
   - `ConfirmDialog`, que ya existe: unificar su uso.
3. **Layout:** navegación inferior en celular (A8) y `loading.tsx` en las rutas
   principales.

### Fase 3 — Errores API ↔ UI (A1)

1. Filtro global en NestJS con un formato único.
2. Mensajes en español en las validaciones.
3. En la UI, errores por campo con `useFieldErrors` y aviso de conexión con
   "Reintentar".

### Fase 4 — Por módulo

1. **Hallazgos:** tarjetas en celular, crear, iniciar y cerrar (C1, C4, A5), y
   borrador local (C3, opción A).
2. **EPP:** firma (A4).
3. **Extintores:** M1.
4. **Gemba Walk.**
5. **CIAEL:** secciones (A6).
6. **ICS:** B1.
7. **Panel administrativo.**
8. **Dashboards:** M5.

### Fase 5 — Verificación

Como está definida en el plan.

### Antes de la Fase 2 conviene decidir dos cosas

1. ¿Se aprueba la cámara nativa del teléfono como opción principal (C2)?
2. ¿Se aprueba el borrador local (opción A) dentro de la Fase 4 de Hallazgos?
