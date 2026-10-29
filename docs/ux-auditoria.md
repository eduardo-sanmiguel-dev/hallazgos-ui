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
*Resuelto en la Fase 4 (ver `docs/ux-componentes.md`, sección 4).*

**C2 · Evidencia con cámara (Hallazgos: crear, iniciar, cerrar; ICS)** — La cámara
del navegador (`react-html5-camera-photo`) guarda la foto al tamaño del visor:
medimos capturas de 385 × 540, 264 × 682 y 1046 × 738 px. Las fotos de galería
llegan a 900 × 1600 o 1368 × 1824. → La evidencia sale borrosa y no sirve para
auditoría. → Usar la **cámara nativa del teléfono** con
`<input type="file" accept="image/*" capture="environment">` (mejor enfoque, flash y
resolución) y comprimir antes de subir con `browser-image-compression`, que ya está
instalada. Mantener la cámara del navegador solo como alternativa. [M]
*Resuelto en la Fase 2 (confirmado en la Fase 5): `PhotoCapture` con "Tomar
foto" (`capture="environment"`) como opción principal, compresión a 1920 px
y ~1 MB, y la cámara del navegador solo al pedirla. Lo usan crear, iniciar y
cerrar hallazgo e ICS.*

**C3 · Captura sin conexión o con señal mala (todos los formularios de campo)** — No
hay borradores, reintentos, tiempo límite en las peticiones ni aviso de "sin
conexión". Si falla el envío o se cierra la pestaña, se pierde lo capturado, foto
incluida. → Retrabajo y hallazgos que no se registran. → Ver la sección
"Conectividad" (propuesta: borrador local por formulario). [M–L]
*Resuelto en Hallazgos (crear, iniciar y cerrar) en la Fase 4: borrador
local con la foto y envío sin confirmar en solo lectura (ver
`docs/ux-componentes.md`, sección 4). También en el registro de recorridos de
Gemba Walk (G1, sección 8) y en el registro de ICS (sección 9). EPP quedó sin
borrador: la idempotencia y "Reintentar" cubren el envío fallido (sección 5).*

**C4 · Cerrar e iniciar un hallazgo (diálogos)** — Cerrar es irreversible y no pide
confirmación. Además, los diálogos no se abren a pantalla completa en celular
(`maxWidth={false}` sin `fullScreen`). → Riesgo de cerrar por error, y en celular el
diálogo queda apretado con la cámara adentro. → Confirmación breve al cerrar, con un
resumen de foto y descripción, y diálogos a pantalla completa en celular. [S]
*Resuelto: confirmación al cerrar (Fase 2) y diálogos a pantalla completa en
celular con progreso de subida (Fase 4).*

### Alto

**A1 · Errores del API** — `handleErrorResponse` muestra `data.message` tal cual. En
errores de validación, NestJS manda un **arreglo** de textos en inglés de
class-validator (solo 12 de 570 validaciones tienen mensaje propio), sin indicar el
campo. Sin conexión se ve el mensaje genérico. Todos los errores se titulan
"¡ Atención !". → El usuario no sabe qué corregir. → Fase 3: formato único de error
(mensaje en español, código, errores por campo), conectarlo con el `useFieldErrors`
que ya existe y distinguir "sin conexión" con la acción "Reintentar". [M]
*Resuelto en la Fase 3 (ver `docs/ux-componentes.md`, sección 3), junto con el
resto de M3: tiempo límite y "Reintentar" sin perder la foto, con clave de
idempotencia para no duplicar registros ni correos.*

**A2 · Áreas táctiles (toda la app)** — El tema no ajusta tamaños: los botones miden
unos 36 px y los botones de ícono pequeños (acciones de tabla) unos 34 px. →
Difícil acertar con guantes o de pie. → En el tema: botones de al menos 44–48 px en
celular y botones de ícono de 48 px en las acciones de tablas y tarjetas. [S]
*Resuelto en la Fase 2. En la Fase 4 (Gemba Walk) se encontró que los botones
de `FormActions` (Guardar y Cancelar al pie de los formularios) seguían en
44 px en pantalla táctil, porque su propio estilo le ganaba al tema; ya miden
48 px.*

**A3 · Contraste** — El verde de marca `#71BF44` como texto sobre blanco (botones con
contorno, enlaces, chips de filtros) tiene 2.27:1; el naranja de advertencia de MUI
`#ED6C02` tiene 3.11:1. El botón relleno (texto oscuro sobre verde) sí cumple con
7.66:1. → Al sol esos textos casi no se leen. → Usar un verde más oscuro solo para
texto e íconos sobre fondo claro (ya existe `primaryTextColor` para encabezados de
tabla) y revisar los colores de advertencia. [S]
*Resuelto en la Fase 2 (confirmado en la Fase 5): `text.brand` (6.4:1) para
texto e íconos verdes, advertencia `#B45309` (5.0:1) e información `#0277BD`
(4.8:1). Los usos que quedan de `primary.main` son rellenos, bordes o
leyendas de color, no texto.*

**A4 · Firma en entregas de EPP** — El lienzo mide 300 × 200 px en celular aunque el
diálogo ocupa toda la pantalla. Además **se puede guardar una firma vacía**:
`saveSignature` no verifica `isEmpty()`. → Firmas ilegibles o en blanco en un
registro que debe tener validez. → Lienzo que ocupe el ancho disponible (y aproveche
la orientación horizontal), botón "Guardar" deshabilitado mientras no haya trazo, y
"Limpiar" visible. [S]
*Resuelto: firma vacía bloqueada (Fase 2); lienzo al ancho de la pantalla,
casi todo el alto en horizontal, trazo más grueso y fondo blanco (Fase 4).*

**A5 · Formulario de nuevo hallazgo** — Tiene 9 campos y todos aparecen en rojo de
error desde que se abre, antes de que el usuario haga algo. El texto de la
descripción dice siempre "…del comportamiento inseguro", aunque la clasificación sea
otra. No se recuerda la última planta, lugar o proceso usado. → Sensación de error
constante y más toques de los necesarios. → Mostrar errores solo al intentar guardar
(usando `useFieldErrors`, como en otros formularios), texto neutro ("Describe lo que
observaste"), y recordar la última planta y el último lugar del usuario en ese
dispositivo. [M]
*Resuelto en la Fase 4: errores solo al intentar guardar, texto neutro y
última planta y lugar recordados por usuario en el dispositivo. El proceso no
se recuerda (no se pidió).*

**A6 · CIAEL** — Son 25 campos en un solo diálogo, sin secciones. → Formulario largo
y fácil de dejar a medias. → Agruparlos en secciones (Evento, Colaborador, Lesión,
Causas) con `FormSection` o un `Stepper` en celular. [M]
*Resuelto en la Fase 4: cinco secciones con `FormSection` (Evento,
Colaborador, Lesión, Causas y Responsables), "Guardar" marca a la vez todo lo
que falta junto a cada campo y pide confirmar antes de descartar lo capturado
(ver `docs/ux-componentes.md`, sección 7). Sin `Stepper`: se evaluó y no se
implementó.*

**A7 · Estados de carga** — 23 pantallas usan una barra lineal (`LoadingLinear`) y
solo 5 usan skeletons. No hay `loading.tsx`. → Saltos de diseño y la sensación de
"no carga". → Skeletons por tipo de pantalla (lista, formulario, dashboard) y
`loading.tsx` en las rutas principales. [M]
*Resuelto: skeletons y `loading.tsx` al navegar (Fase 2) y, en la Fase 5,
`TableSkeleton` en la primera carga de las 20 listas que usaban la barra y
en EPP (tabla en escritorio, tarjetas en celular). La barra queda solo fuera
de las listas (detalle y registro de Gemba Walk, guardias de acceso y
"Abriendo cámara…"). En Hallazgos la consulta no usa caché, así que el
esqueleto aparece en cada búsqueda, igual que antes la barra.*

**A8 · Navegación en celular** — Para crear un hallazgo desde otra pantalla hay que
abrir el menú lateral, ir a Hallazgos y tocar "Crear". No hay acceso directo a las
acciones de campo. → Más pasos en la tarea más frecuente. → Navegación inferior en
celular con 3–4 accesos según el rol (Hallazgos, Nuevo hallazgo, Gemba Walk, EPP). [M]
*Resuelto en la Fase 2 (confirmado en la Fase 5): `MobileBottomNav` con
"Nuevo hallazgo" al centro y hasta 3 accesos según el menú del usuario (ver
`docs/ux-componentes.md`, sección 2).*

### Medio

**M1 · Inspección de extintores (formulario)** — El orden de botones confunde: "Crear
evaluación", luego "Cancelar" y al final "Guardar". → Se toca "Cancelar" por error. →
Agregar evaluación arriba y, al pie, "Guardar" como principal y "Cancelar" como
secundario, igual que en el resto de formularios. [S]
*Resuelto en la Fase 4: "Agregar evaluación" arriba de las evaluaciones y
`FormActions` al pie; además, secciones, errores por campo (incluidos los de
cada evaluación) y lista en tarjetas en celular.*

**M2 · Botones de evidencia (Hallazgos, ICS)** — "Capturar evidencia | Adjuntar
imagen" es un `ButtonGroup` que en celular se aprieta en dos líneas. La vista previa
del adjunto usa una cuadrícula de `minmax(400px, …)`, más ancha que un celular de
390 px. Si la compresión falla, solo se registra en consola y el usuario no se
entera. → Botones apilados a ancho completo, vista previa adaptable y mensaje claro si
la imagen no se pudo procesar. [S]
*Resuelto en la Fase 2 (confirmado en la Fase 5): en `PhotoCapture`, botones
apilados a ancho completo en celular, vista previa adaptable (260 px de alto
en celular) y mensajes si el archivo no es imagen, no se pudo procesar o
pesa más de 2 MB.*

**M3 · Sin progreso de subida** — Al guardar con foto solo se ve un spinner. Con mala
señal puede tardar sin dar señales de avance. → `onUploadProgress` de axios para una
barra de progreso y tiempo límite con opción de reintentar. [S]
*Resuelto en las fases 2 y 3 (confirmado en la Fase 5): "Subiendo foto…
N %" en crear, iniciar y cerrar hallazgo e ICS (`useUploadProgress`),
tiempo límite de 90 s con foto y "Reintentar" que reenvía la misma petición.*

**M4 · ICS: errores al guardar** — *Corregido.* La auditoría marcó que "Guardar" no
tenía estado de carga, pero fue un falso positivo: sí lo tiene, por medio de
`FormActions` (`isSaving`). El problema real era otro: si el API rechazaba el
registro, no se mostraba ningún mensaje, porque `IcsService.create` usa axios
directo sin el interceptor de errores y la pantalla no tenía `.catch`.

**M5 · Dashboard en celular** — Si el usuario tiene varias plantas, entra sin planta
seleccionada y ve todas las gráficas vacías con "Seleccione planta, fecha inicio y
fecha fin". → Primera impresión de "no funciona". → Preseleccionar la planta (la
única, o la última usada) y un estado vacío único en lugar de uno por gráfica. [S]
*Resuelto en la Fase 4, también en Análisis de datos EPP (ver
`docs/ux-componentes.md`, sección 10): planta propuesta (la única o la última
elegida por el usuario en esa pantalla y dispositivo), periodo por omisión de
los últimos 30 días (antes, el mes en curso: casi vacío los primeros días del
mes) y un solo aviso para la pantalla (sin planta, sin periodo, sin datos o
error con "Reintentar"). En celular, los filtros ya no quedan fijos y las
donas no cortan sus etiquetas.*

**M6 · Tablas del panel administrativo (celular)** — Se desplazan de lado, y los
nombres y correos se parten en 2–3 líneas (por ejemplo, en Usuarios). → Uso incómodo
en celular, aunque es menos frecuente. → Componente `ResponsiveTable`: tabla en
escritorio y tarjetas en celular, empezando por Usuarios y Colaboradores. [M]
*Resuelto en la Fase 4 (panel administrativo, grupos 1 a 4; ver
`docs/ux-componentes.md`, sección 11): todas las listas del panel usan
`ResponsiveTable` (tarjetas en celular, sin desplazamiento lateral):
Usuarios, Colaboradores, Plantas, Lugares, Zonas, Procesos, Criterios,
Tipos de criterios, Equipos de protección, Equipos de emergencia (con su
casilla para imprimir en cada tarjeta), HDS y la configuración de Gemba
Walk.*

**M7 · Estados vacío, sin permisos y error** — Ya existe un componente `EmptyState`,
pero solo lo usan 4 pantallas (CIAEL, equipos de emergencia y dos de Análisis de datos
EPP), y EPP tiene su propio mensaje. Las demás tablas, de 25 en total, muestran solo
los encabezados cuando no hay datos. "Sin permisos" solo existe en Gemba Walk. →
Ambigüedad: ¿no hay datos o falló? → Usar `EmptyState` en todas las tablas y agregar
`ErrorState` y `NoAccessState` con el mismo estilo. [M]
*Resuelto en la Fase 2 y extendido en la Fase 4 (confirmado en la Fase 5):
todas las listas muestran vacío o error con "Reintentar"
(`TableDefaultServer`, `ResponsiveTable`, `TableBodyState`), y
`NoAccessState` cubre la entrada por URL a cualquier página sin acceso.*

**M8 · Consistencia de componentes** — En el formulario de hallazgo, la descripción
usa un `TextField` estándar dentro de un `Paper` mientras el resto son campos con
contorno. Los títulos de los avisos llevan espacios ("¡ Correcto !"). Hay estilos
sueltos (`style={{…}}`) en componentes compartidos. → Aspecto poco pulido. → Unificar
en el tema y en componentes base. [S]
*Resuelto: descripciones con contorno (Fase 4); en la Fase 5, "¡Correcto!" y
"¡Atención!" sin espacios y el último estilo suelto de un componente
compartido (`SelectDefault`) pasó a `sx`. Queda `style` solo donde el
componente no acepta `sx`: `next/image` (vista previa de `PhotoCapture`,
logo, firmas de EPP), `<video>`/`<canvas>` del lector QR y una fila de
relleno de la tabla de equipos de emergencia.*

### Bajo

**B1 · Teclados por tipo de campo** — Solo 4 campos usan `inputMode` y 6 usan
`type="number|tel|email"`. Por ejemplo, "Personas totales" (ICS) y los códigos de
colaborador deberían abrir el teclado numérico. [S]
*Resuelto en la Fase 4: ya no queda ningún `type="number"` en la app.
- Formularios de campo: "Personas totales" (ICS), días de incapacidad y
  horas laboradas (CIAEL) con teclado numérico; el código de colaborador ya
  lo tenía.
- Panel administrativo: frecuencia de entrega con teclado numérico; precio y
  capacidad con teclado decimal; correo de usuarios con teclado de correo;
  link de plantas con teclado de direcciones web. Las coordenadas de plantas
  usan el teclado de texto con validación de formato (decisión aprobada: la
  longitud es negativa y el teclado decimal del iPhone no tiene signo
  menos).*

**B2 · Breadcrumbs** — Los formularios y los detalles no indican de dónde vienen. En
escritorio ayudaría una ruta corta ("Configuración › Lugares › Editar"). [S]
*Resuelto en la Fase 4 (ver `docs/ux-componentes.md`, sección 11): en
los 13 formularios de Configuración, solo en tablet y escritorio. La ruta
sale del menú ("Configuración › Gemba Walk › Zonas › Nueva zona de Gemba
Walk") y el enlace a la lista pasa por la confirmación de salida. Equipos
de protección no lleva: su formulario es un diálogo.*

**B3 · Indicador de Next.js** — La burbuja redonda de abajo a la izquierda que se ve
en desarrollo es el indicador de Next.js. No existe en producción, así que no
requiere cambios.

### Gemba Walk (revisión de la Fase 4)

La auditoría original no tenía hallazgos de este módulo. Se revisaron sus
pantallas en celular (390 px) y escritorio (1440 px) con los mismos
criterios. Detalle de lo implementado en `docs/ux-componentes.md`, sección 8.

| ID | Prioridad | Pantalla | Problema | Estado |
| --- | --- | --- | --- | --- |
| G1 | Crítico | `/form` | El inicio del recorrido vivía solo en memoria: al recargar o cerrar la app se perdían las respuestas y, pasada la tolerancia, el recorrido ya no se podía registrar. | *Resuelto: borrador local con la hora de inicio y el comprobante originales.* |
| G2 | Alto | `/gemba-walk` | Tabla de 12 columnas: en celular, resultado y "Ver" fuera de la pantalla. | *Resuelto: tarjetas en celular.* |
| G3 | Alto | `/form` | "Cancelar" salía sin preguntar; un reintento de un registro que sí llegó respondía "ya tiene un recorrido registrado". | *Resuelto: confirmación al salir y clave de idempotencia.* |
| G4 | Medio | `/form` | "NC · switch · C · chip" redundante y poco claro con guantes; el conteo C/NC solo arriba. | *Resuelto: botones "Cumple / No cumple" y barra fija con conteo.* |
| G5 | Medio | `/view` | Sin el recorrido o con error, la barra de carga quedaba para siempre. | *Resuelto: "Recorrido no encontrado" y "Reintentar".* |
| G6 | Medio | `/schedule` | En celular, el mes era una cuadrícula ilegible. | *Resuelto: lista de la semana en celular.* |
| G7 | Medio | `/calendar/form` | En pantalla táctil, elegir días pedía mantener presionado 1 s, sin indicación. | *Resuelto: 350 ms y texto de ayuda.* |
| G8 | Bajo | Zonas, observadores, conceptos, calendario | Tablas que se desplazan de lado en celular (como M6). | *Resuelto: tarjetas en celular (panel administrativo, grupo 4).* |
| G9 | Bajo | `/form`, `/view`, `/schedule` | Títulos en verde claro (A3), botones sueltos, "Regresar" como acción principal. | *Resuelto: `text.brand`, `FormActions` y "Regresar" secundario.* |

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
   *Resuelto: ahora lo decide la bandera "Requiere evidencia fotográfica" de cada
   clasificación, y el API la valida al crear y al cerrar.*
2. **Acceso por URL directa.** Varias pantallas administrativas solo se ocultan del
   menú; la propia página no bloquea a quien entra por URL. El API sí protege las
   escrituras, pero un usuario sin permiso podría ver pantallas vacías o con errores
   en lugar de un "sin acceso". Conviene revisar qué consultas de lectura son
   visibles por rol.
   - *Parte visual resuelta en la Fase 2:* `RouteAccessGuard` muestra
     `NoAccessState` a quien entra por URL a una página que su menú no muestra,
     y la página no se monta (ver `docs/ux-componentes.md`).
   - **Pendiente:** revisar en el API qué consultas de lectura devuelven datos a
     roles que no deberían verlos. El bloqueo de la UI no lo evita: la
     petición directa al API sigue respondiendo.
3. **Aviso de `pg`** al guardar entidades con relaciones muchos a muchos. Es interno
   de TypeORM, no afecta hoy y ya está documentado.
4. **Destinatarios fijos de la planta 3.** Los avisos por correo de los hallazgos de
   la planta 3 (Hada International) se envían solo a una lista de 6 correos escrita
   en el código (`PLANT_3_RECIPIENT_EMAILS` en
   `hallazgos-api/src/users/users.service.ts`), filtrada a los usuarios activos de
   esa planta.
   - *Corregido (2026-10-24):* la comparación distinguía mayúsculas. Consulta de
     solo lectura en producción: 4 de los 6 correos de la lista están escritos
     distinto que en la base (`Dspaggiari@`, `Aholguin@`, `Cvelasquez@`,
     `Btorres@`), y 3 de ellos son de la planta 3. Solo se avisaba a 1 persona
     (`sst@`); con la corrección se avisa a 4.
   - Los otros 2 de la lista (`strujillo@` y `dspaggiari@`) existen y están
     activos, pero no tienen asignada la planta 3, así que siguen sin recibir
     avisos. Conviene confirmar si deben tenerla.
   - **Pendiente:** mover la lista a configuración (variable de entorno o
     catálogo editable por un administrador). Hoy cambiar quién recibe los avisos
     requiere un despliegue.
5. **Prueba intermitente de extintores.** En el API,
   `registra una inspección y descarga su formato (Excel)`
   (`test/db/gemba-extinguishers.db-spec.ts`) falló una vez en la corrida completa
   de `pnpm test:db` y pasó en la siguiente sin cambios.
   - *Fase 5:* no se reprodujo (12 corridas del archivo y 4 de la suite
     completa). Causa probable, de la prueba y no del código: el archivo
     creaba **dos apps en el mismo proceso** (una por `describe`), lo que
     `test/db/README.md` ya documentaba como causa de caídas intermitentes
     en Windows; la prueba que falló es la primera de la segunda app. Se
     separó en `gemba-walk.db-spec.ts` y
     `extinguisher-inspections.db-spec.ts` (una app por archivo). El
     servicio no cambió.
   - `auth-users.db-spec.ts` tenía el mismo patrón (dos apps); se separó
     igual en `auth.db-spec.ts` y `users.db-spec.ts`.
6. **Etiquetas de prioridad invertidas.** Se guarda solo el número de días
   (`priorityDays`); el vencimiento se calcula con la fecha de registro más esos
   días, así que ningún vencimiento está mal. Lo que cambió fue el nombre de cada
   plazo:
   - Hasta el 26-jun-2026 la UI guardaba "Inmediato" = 8 días y "Corto plazo" =
     2 días (también la carga inicial del 4-may, ids 3176–3496). Desde entonces,
     formulario, tabla, detalle y correos usan Inmediato = 2 y Corto plazo = 8,
     pero el dashboard siguió con el mapeo anterior.
   - *Corregido (2026-10-27):* un solo mapeo en el API
     (`src/shared/constants/priority.ts`, para dashboard, correos y carga
     inicial) y uno en la UI (`priorityOptions.ts`): Inmediato = 2 días (riesgo
     Crítico), Corto plazo = 8 (Alto), Mediano plazo = 15 (Medio) y Largo plazo
     = 30 (Bajo).
   - **Se decidió conservar los días guardados.** Por eso, los hallazgos
     anteriores al 27-jun-2026 pueden mostrar una etiqueta de prioridad distinta
     a la que eligió quien los capturó: quien eligió "Inmediato (8 días)" ahora
     ve "Corto plazo (8 días)", y al revés. Son unos 304 hallazgos con 2 u 8
     días; otros 16, del 4 al 26 de junio, no se puede saber con cuál mapeo se
     capturaron.
7. **Endpoints de CIAEL que no hacen nada (pendiente).** Quedaron del
   esqueleto de NestJS y la UI no los usa (`hallazgos-api/src/ciaels/`):
   - `PATCH /ciaels/:id` responde el mismo id y cuerpo que recibió, sin
     guardar.
   - `DELETE /ciaels/:id` responde "Esta acción elimina el registro CIAEL
     #N", pero **no elimina nada**.
   - `POST /ciaels/seed` responde "Se llamó al método seed" y no hace nada.

   Quien llame al API directamente podría creer que editó o borró un
   registro. Falta decidir si se quitan o se implementan (con sus permisos).
8. **Endpoints de ICS que no hacen nada (pendiente).** Igual que en CIAEL
   (punto 7); la UI no los usa. Se tradujeron sus textos, sin cambiar lo que
   hacen:
   - `PATCH /ics/:id` responde el id y el cuerpo que recibió, sin guardar.
   - `POST`, `GET`, `GET /:id`, `PATCH /:id` y `DELETE /:id` de
     `/rules-of-life` (catálogo de reglas de vida) responden un texto ("Esta
     acción elimina la regla de vida #N") o el mismo cuerpo, sin consultar ni
     guardar nada. ICS lee el catálogo de `GET /ics/catalogs`.
   - `POST /rules-of-life/seed` (solo administradores) vuelve a insertar el
     catálogo completo en cada llamada (duplicados); ya hay una prueba
     marcada como fallida que lo documenta.
   - En la UI, `/ics/form?id=N` dice "Editar registro de ICS" pero no carga
     ni guarda nada (la lista no ofrece editar).

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

### Estado al cierre de la Fase 4

**Resueltos** (con su marca arriba): C1, C3, C4, A1, A2, A4, A5, A6, M1,
M4, M5, M6, B1, B2 y G1 a G9.

**Implementados en las fases 2 y 3, sin marca en esta auditoría** (están
en `docs/ux-componentes.md`, secciones 1 a 3): C2 (cámara nativa y
compresión, `PhotoCapture`), A3 (contraste), A8 (navegación inferior), M2
(botones de evidencia y mensajes de la imagen), M3 (progreso de subida,
tiempo límite y "Reintentar") y M7 (vacío, error y sin acceso). Conviene
confirmarlos y marcarlos en la Fase 5.

**Parciales:**
- A7: hay skeletons y `loading.tsx` al navegar, pero las listas siguen con
  la barra lineal (`LoadingLinear`) en su primera carga.
- M8: descripciones con contorno en hallazgos e ICS; los títulos de los
  avisos de `notify` siguen con espacios ("¡ Correcto !").

**Abiertos o documentados** (no se cambian sin decisión):
- Sección 5: lectura del API por rol (punto 2), destinatarios fijos de la
  planta 3 (punto 4), prueba intermitente de extintores (punto 5) y
  endpoints de CIAEL e ICS que no hacen nada (puntos 7 y 8).
- Nomenclatura lugar/zona/área entre pantallas: se decidió dejarla como
  está (`docs/ux-componentes.md`, sección 11).
- ICS: si "Estándar de comportamiento" y "Área" deben ser obligatorios lo
  decide el cliente; hoy no lo son, ni en la UI ni en el API.
- Pendientes para la Fase 5 en `docs/ux-componentes.md`, sección 12.

### Fase 5 — Verificación

Como está definida en el plan.

**Parte 1 (cierre de pendientes):** confirmados y marcados C2, A3, A8, M2,
M3 y M7; resueltos A7 y M8; atendidos los pendientes de
`docs/ux-componentes.md`, sección 12, y la prueba intermitente de la
sección 5, punto 5.

**Parte 2 (verificación):** ver `docs/ux-componentes.md`, sección 13.
- **Visibilidad por rol y por planta:** igual que en producción. El menú
  (de donde salen la barra inferior y el bloqueo por URL) tiene las mismas
  reglas que `d7e1236`; en el API, las mismas 88 rutas con `AdminGuard` que
  `ae4b151`, y los filtros por planta solo cambiaron sus textos. Lo único con
  efecto es la corrección ya documentada de los correos de la planta 3
  (sección 5, punto 4).
- **Captura por tipo de usuario** (Administrador, Supervisor, General
  observador y no observador, solo-EPP y solo-HDS) a 360, 414 y 1440 px: 108
  combinaciones; cada usuario ve exactamente sus flujos y "sin acceso" en
  los demás, sin desplazamiento lateral ni errores de página, y "Guardar"
  marca lo que falta en todos.
- **Teclado, etiquetas y contraste:** sin controles sin nombre, sin foco
  invisible y sin texto bajo AA en el tema claro ni en halloween. En el tema
  oscuro, dos casos apenas debajo, corregidos al cierre (sección 13).
- **Red lenta y fallos del API:** se corrigió un ciclo de peticiones en la
  lista de hallazgos y dos estados que decían "sin registros" sin haber
  consultado (sección 13).
- **Pruebas:** API 1485 unitarias y 227 con base de datos; UI 489 e2e, tipos
  y lint.

**Parte 3 (cierre):** se resolvieron los pendientes aprobados de la
verificación (contraste del tema oscuro, avisos repetidos, "Cargando…" en
"Nuevo hallazgo", errores de subida en español y áreas táctiles; ver
`docs/ux-componentes.md`, sección 13). Resumen final por módulo, pendientes y
recomendaciones en `docs/ux-cambios.md`; lista de despliegue en
`docs/despliegue.md`. Pruebas al cierre: API 1496 unitarias y 228 con base de
datos; UI 496 e2e, tipos y lint.

### Antes de la Fase 2 conviene decidir dos cosas

1. ¿Se aprueba la cámara nativa del teléfono como opción principal (C2)?
2. ¿Se aprueba el borrador local (opción A) dentro de la Fase 4 de Hallazgos?
