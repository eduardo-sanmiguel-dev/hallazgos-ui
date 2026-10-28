# Despliegue de las mejoras de UX

Qué hacer al subir a producción los cambios del plan de mejora de UX. Se
actualiza con cada módulo de la Fase 4.

**Estado al 27-oct-2026:** producción está en `ae4b151` (API) y `d7e1236` (UI).
Falta desplegar todo lo de las fases 1 a 3: commit "feat: backup" en ambos
repositorios (`306a372` API, `3313cf7` UI).

| Servidor | Proceso pm2 | Ruta | Dominio |
| --- | --- | --- | --- |
| API | `api-comp` (fork, puerto 4000) | `/home/eduardo/hallazgos-api` | `api.comportarte.com` (`/etc/nginx/sites-available/api.conf`) |
| UI | `ui-comp` (puerto 3000) | `/home/eduardo/hallazgos-ui` | `comportarte.com` (`ui.conf`) |

No hay variables de entorno nuevas: los `.env.production` del servidor ya
tienen todas las que pide el API (`joi.validarion.ts`). La UI tiene **una
dependencia nueva** desde Gemba Walk (`@fullcalendar/list`, ver la sección 5):
instalar dependencias antes de `next build`.

---

## 1. Antes de desplegar

### 1.1 Respaldo de la base

Las dos migraciones son pequeñas y tienen `down`, pero tocan una tabla de
negocio (`main_type`). Respaldo antes de reiniciar el API.

### 1.2 Revisar los datos que necesita la migración `requires_evidence`

`AddRequiresEvidenceToMainTypes1792860000000` agrega la bandera "Requiere
evidencia fotográfica" a las clasificaciones y la apaga **solo** en la de
comportamiento inseguro. Debe haber **exactamente una** clasificación cuyo
nombre contenga "comportamiento inseguro"; con cero o varias, la migración falla
a propósito (en transacción, sin dejar nada a medias) y **el API no arranca**.

Consulta de solo lectura en producción:

```sql
SELECT id, name, "isActive"
  FROM main_type
 WHERE LOWER(name) LIKE '%comportamiento inseguro%';
```

Debe regresar una sola fila (cuenta también las inactivas). "Comportamiento por
condición insegura" no coincide. Si hay más de una, renombrar antes de
desplegar.

### 1.3 nginx: límite de tamaño de las fotos (aplicar antes)

Revisión del 27-oct-2026 (solo lectura) en `/etc/nginx/nginx.conf`,
`sites-enabled/` (`api.conf` y los demás), `conf.d/` (vacío) y `snippets/`:

- **`client_max_body_size` no está definido en ningún lado**, así que nginx usa
  su valor por omisión: **1 MB**. El API acepta fotos de hasta 2 MB.
- Evidencia: de las 8452 fotos en el servidor, 163 pesan entre 900 KB y 1 MB y
  **ninguna** pasa de 1 MB (la mayor, 1 047 355 bytes). Las más pesadas las
  rechazaba nginx con un 413 antes de llegar al API.
- No hay `proxy_read_timeout`, `proxy_send_timeout` ni `client_body_timeout`:
  quedan en 60 s. No afectan a los 90 s de la UI para subir fotos: los tres
  miden el tiempo **entre dos lecturas o escrituras**, no la subida completa, y
  nginx recibe todo el cuerpo antes de pasarlo al API
  (`proxy_request_buffering` activo por omisión). Una subida lenta pero
  continua no se corta.

**Cambio:** en `/etc/nginx/sites-available/api.conf`, dentro del bloque
`server` que tiene `listen 443 ssl http2;` (`server_name api.comportarte.com`),
justo debajo de `server_name`:

```nginx
    # Fotos de evidencia: el API acepta hasta 2 MB; margen para el multipart.
    client_max_body_size 3m;
```

Luego:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`reload` no corta conexiones. La UI ya muestra "Archivo muy pesado" si llega un
413 de nginx (antes no mostraba nada útil).

---

## 2. Orden de despliegue

**API primero, después UI.** El API nuevo es compatible con la UI anterior
(el campo `message` de los errores sigue existiendo, ahora siempre como texto,
y la clave de idempotencia es opcional). La UI nueva sí necesita el API nuevo:
manda `Idempotency-Key` y espera los códigos de error (`SESSION_EXPIRED`,
`VALIDATION_FAILED`…).

1. **API** (`api-comp`): actualizar código, compilar y reiniciar.
   - Las migraciones corren solas al arrancar (`migrationsRun: true`), en este
     orden:
     1. `AddRequiresEvidenceToMainTypes1792860000000`: columna
        `main_type.requires_evidence`.
     2. `CreateIdempotencyKeys1792900000000`: tabla `idempotency_key`
        (envíos ya procesados; se borran solos a los 7 días, cron diario a las
        3 a. m.).
   - Revisar en el log del arranque que no haya error de migración y que diga
     `Running on port: [4000]`.
2. **UI** (`ui-comp`): actualizar código, `next build` y reiniciar.

### Si hay que revertir

- **Solo UI:** volver al commit anterior y reconstruir. El API nuevo funciona
  con la UI anterior.
- **API:** primero revertir la UI. Luego, si hace falta deshacer las
  migraciones, `pnpm migration:revert:prod` dos veces (deshace la última cada
  vez: primero `idempotency_key`, luego `requires_evidence`) y volver al commit
  anterior del API.

---

## 3. Después de desplegar (verificación rápida)

1. Iniciar sesión con una contraseña equivocada: el aviso dice "No se pudo
   iniciar sesión".
2. Crear un hallazgo con una foto de entre 1 y 2 MB: se guarda (antes, nginx la
   rechazaba).
3. `SELECT count(*) FROM idempotency_key;` crece con cada hallazgo creado,
   iniciado o cerrado desde la UI nueva.
4. Un error de validación (por ejemplo, ubicación de 3 letras en equipos de
   emergencia) sale en español y marca el campo.
5. Dashboard: las gráficas de prioridad y de riesgo cargan (ver 4.1).

---

## 4. Cambios que el cliente va a notar

### 4.1 Dashboard: gráficas de prioridad y de riesgo

El dashboard usaba el mapeo de prioridad anterior al 26-jun-2026 (Inmediato =
8 días, Corto plazo = 2 días). Ahora todo usa uno solo: **Inmediato = 2 días
(riesgo Crítico), Corto plazo = 8 (Alto), Mediano plazo = 15 (Medio), Largo
plazo = 30 (Bajo)**.

- Las barras de "Inmediato" y "Corto plazo" del dashboard **intercambian sus
  cantidades** respecto a lo que se veía, y lo mismo pasa con Crítico y Alto en
  la gráfica de riesgo.
- Se conservaron los días guardados, así que ningún vencimiento cambia. Pero
  unos 304 hallazgos anteriores al 27-jun-2026 muestran una etiqueta distinta
  a la que eligió quien los capturó: quien eligió "Inmediato (8 días)" ahora ve
  "Corto plazo (8 días)", y al revés (detalle en `docs/ux-auditoria.md`,
  sección 5, punto 6).
- Los correos también usan el mapeo único.

Conviene avisarlo al cliente antes de desplegar.

### 4.2 Avisos por correo de la planta 3

La lista fija de destinatarios distinguía mayúsculas: solo se avisaba a 1
persona (`sst@`). Ahora se avisa a 4. `strujillo@` y `dspaggiari@` siguen sin
recibir avisos porque no tienen asignada la planta 3: confirmar con el cliente
si deben tenerla.

### 4.3 Hallazgos y evidencia

- **Foto obligatoria según la clasificación:** la decide la bandera "Requiere
  evidencia fotográfica" de cada clasificación (en Criterios), no el nombre.
  Queda apagada solo en comportamiento inseguro, igual que antes. El API la
  valida al crear y al cerrar.
- **Cámara:** "Tomar foto" abre la cámara del teléfono (mejor resolución,
  enfoque y flash). La cámara del navegador queda como alternativa.
- Las fotos se comprimen antes de subir (máximo 1920 px y ~1 MB) y se ve el
  progreso de subida.
- Cerrar un hallazgo pide confirmación.

### 4.4 Toda la app

- Botones más grandes en pantallas táctiles y mejor contraste del verde y del
  naranja.
- Barra de navegación inferior en celular con "Nuevo hallazgo" al centro.
- Quien entra por URL a una pantalla que su menú no muestra ve "No tienes
  acceso a esta sección" (el API ya protegía las escrituras).
- Estados de carga, vacío y error con el mismo diseño, con "Reintentar".

### 4.5 Errores

- Mensajes en español, con el título según el tipo ("Revisa los datos",
  "Sin permiso", "Sin conexión", "Error del servidor"…) y el campo marcado en
  el formulario.
- Los errores 500 muestran una **referencia** (por ejemplo, `E-7K3Q9P`) que se
  busca en OpenObserve para encontrar el detalle.
- Sin conexión o con tiempo agotado al guardar: "Reintentar" sin perder la
  foto, y sin duplicar el registro ni los correos.
- Cuando la sesión termina (token vencido o usuario desactivado) aparece "Tu
  sesión terminó" antes de mandar al login. Antes se recargaba la página sin
  aviso (y un usuario desactivado quedaba en un ciclo de recargas).

---

## 5. Pendientes de despliegue por módulo (Fase 4)

### Hallazgos

- **Sin migraciones, variables ni cambios de nginx.**
- **API:** solo un texto. "manufacturingPlantId es obligatorio" (dashboard y
  consultas filtradas por planta) ahora dice "Selecciona una planta.".
- **UI:**
  - En celular, la lista de hallazgos se ve en tarjetas.
  - Los diálogos de iniciar y cerrar abren a pantalla completa en celular y
    muestran el progreso de subida.
  - El formulario de nuevo hallazgo ya no aparece en rojo al abrir, marca lo
    que falta al tocar "Crear hallazgo" y recuerda la última planta y el
    último lugar.
- **Para el cliente:** el botón "Crear hallazgo" ya no está deshabilitado
  mientras falta algo; al tocarlo, se indica qué completar. La planta y el
  lugar se guardan solo en ese navegador; no hay que hacer nada en el
  servidor.

#### Borrador local (crear, iniciar y cerrar hallazgo)

- **No requiere nada en el servidor:** ni migraciones ni configuración. Los
  borradores viven en IndexedDB de cada navegador y se borran solos a los 7
  días.
- **Cambios del API que lo acompañan (compatibles con la UI anterior):**
  - `POST /evidences` responde `{ "id": N }` en lugar del texto `ok`. La UI
    anterior no lee esa respuesta.
  - Un reintento ya procesado (misma clave de idempotencia) responde con el
    header `Idempotent-Replayed: true`, expuesto por CORS en `main.ts` junto a
    `Content-Disposition`. No hay que tocar nginx: el header pasa tal cual.
- **Para el cliente:**
  - Lo capturado en esos tres formularios, foto incluida, se guarda en el
    dispositivo mientras se escribe. Al volver se ofrece "Recuperar" o
    "Descartar".
  - **Al cerrar sesión se borran los borradores sin enviar de ese
    dispositivo**, con aviso previo. Si la sesión vence sola, se conservan y
    el mismo usuario los recupera al volver a entrar.
  - Si un envío se quedó sin respuesta, el borrador queda en solo lectura
    con "Reintentar envío" o "Descartar"; el reintento nunca duplica el
    hallazgo. Si ya se había guardado, se avisa "Ya se había guardado
    (hallazgo #N)".

### EPP

- **Sin migraciones, variables ni cambios de nginx.**
- **API:**
  - Los mensajes en inglés de entregas y colaboradores ahora están en
    español: "Colaborador #N no encontrado.", "Entrega de EPP #N no
    encontrada." y "Puesto #N no encontrado".
  - **General (todo el API):** un cuerpo de más de 100 KB responde **413**
    "La información enviada es demasiado grande." y un JSON mal formado,
    400; antes ambos llegaban como 500 genérico. El límite de 100 KB no
    cambia.
- **UI:**
  - Firma: el lienzo ocupa el ancho de la pantalla y, con el teléfono en
    horizontal, casi todo el alto. Trazo más grueso.
  - En celular, la lista de entregas se ve en tarjetas con el historial
    desplegable, y los equipos agregados en una lista (antes, tablas que se
    desplazaban de lado).
  - Vacío y error de la lista con los componentes compartidos ("Reintentar").
- **Para el cliente:**
  - Las firmas nuevas se guardan **recortadas al trazo, transparentes y de
    600 × 200 px como máximo** (unos 20–25 KB; las del lienzo a pantalla
    completa llegaban a ~100 KB, el límite del API). En pantalla se muestran
    sobre fondo blanco, también en el tema oscuro. Las firmas anteriores no
    cambian.
  - **Formato de Excel:** las firmas nuevas se insertan con **su proporción,
    centradas en la celda** y sin tapar los bordes. Las anteriores (300 × 200
    y 500 × 200 px) se siguen estirando a 100 × 25 px como siempre, para que
    no se vean más chicas que hasta ahora. Revisado exportando el formato a
    PDF con Excel.
  - En celular vertical el recuadro para firmar es alargado (2.5:1, como una
    línea de firma) en lugar de casi cuadrado, y se sigue sugiriendo girar el
    teléfono para tener más espacio. En horizontal no cambia.
  - Si se gira el teléfono mientras se firma, el lienzo se limpia y hay que
    firmar de nuevo (así la firma no se guarda cortada ni deformada).

### Inspección de extintores

- **Sin migraciones, variables ni cambios de nginx.**
- **API:** solo textos. "Inspección de extintores #N no encontrada" y "Equipo
  de emergencia #N no encontrado" (antes en inglés). Las etiquetas de los
  errores de validación dicen "Pasador" y "Manómetro", como en la pantalla.
- **UI:**
  - Formulario en dos secciones: "Inspección" (planta y próxima recarga) y
    "Evaluaciones", con **"Agregar evaluación" arriba** y **Guardar
    (principal) y Cancelar al pie**, como el resto de los formularios (M1).
  - "Guardar" ya no está deshabilitado: al tocarlo se marca lo que falta
    junto al campo. Los errores del API de cada evaluación (por ejemplo, la
    capacidad del extintor) se muestran en su tarjeta.
  - Observaciones limitadas a 500 caracteres, con contador.
  - En celular, la lista de inspecciones se ve en tarjetas.

### CIAEL

- **Sin migraciones, variables ni cambios de nginx.**
- **API:** solo textos (compatibles con la UI anterior).
  - Los 404 de catálogos ahora están en español: "Zona #N no encontrada",
    "Colaborador #N no encontrado", "Registro CIAEL #N no encontrado", etc.
    (antes, por ejemplo, "AtAgent with id N not found").
  - Sin máquina ni nombre de máquina: "Selecciona la máquina o equipo." (antes
    "Machine id or name is required").
  - En el resumen de los errores de validación, el cargo se llama "Nombre del
    cargo", como en la pantalla (antes "Puesto").
- **UI:**
  - El formulario se divide en cinco secciones: Evento, Colaborador, Lesión,
    Causas y Responsables. "Guardar" pasó de la barra de arriba al pie, junto
    a "Cancelar".
  - Lo que depende de la planta (zona, colaborador, cargo, máquina, tarea) y
    el líder de área (depende de la zona) quedan deshabilitados hasta
    elegirlas. Si se cambia la planta o la zona, se limpian y un aviso dice
    cuáles volver a elegir (antes se conservaban aunque fueran de otra
    planta).
  - En celular, la lista se ve en tarjetas.
- **Para el cliente:**
  - "Guardar" marca **de una vez todo lo que falta**, junto a cada campo, y
    lleva al primero. Antes avisaba de un campo a la vez.
  - Cerrar el formulario con algo capturado pide confirmar ("¿Descartar el
    registro?"). Antes se perdía sin aviso, también con la tecla Esc.

### Gemba Walk

- **Sin migraciones, variables ni cambios de nginx.** La clave de
  idempotencia usa la tabla `idempotency_key` que ya existe.
- **API:** `POST /gemba-walk/walks` (registrar recorrido) acepta
  `Idempotency-Key`. Un reintento con la misma clave devuelve el recorrido ya
  registrado con `Idempotent-Replayed: true`, en lugar de "El evento
  seleccionado ya tiene un recorrido registrado". Sin el header funciona como
  antes (compatible con la UI anterior).
- **UI: dependencia nueva** `@fullcalendar/list` **6.1.21**, la misma
  versión exacta que los demás paquetes de FullCalendar. En el servidor:
  `pnpm install --frozen-lockfile` antes de `next build`.
- **UI:**
  - Registrar recorrido: borrador local del recorrido iniciado, botones
    "Cumple / No cumple", barra fija al pie con el conteo y "Terminar
    recorrido", y confirmación al salir.
  - En celular, la lista de recorridos se ve en tarjetas y la agenda como
    lista de la semana.
  - El detalle avisa si el recorrido no existe o no cargó ("Reintentar").
  - Calendario: en pantalla táctil basta mantener presionado un momento para
    elegir días.
- **Para el cliente:**
  - **Un recorrido iniciado ya no se pierde** si se recarga la página, se
    cierra la app o se pierde la señal. Al volver se ofrece "Recuperar" y
    sigue con su hora de inicio original, **aunque haya pasado la tolerancia
    de 15 minutos** (la tolerancia aplica al iniciar; no cambió).
  - **La duración de un recorrido recuperado incluye el tiempo que estuvo
    interrumpido** (se mide de la hora de inicio a la de registro). Solo se
    ve en la lista y en el detalle del recorrido; ningún Excel, dashboard ni
    indicador la usa.
  - Si al recuperarlo ya no se puede registrar (es de otro día o ya lo
    registró otro observador u otro dispositivo), queda solo para consulta,
    con el motivo y la opción "Descartar recorrido".
  - El borrador vive solo en ese dispositivo y navegador; al cerrar sesión
    se borra (con aviso), como en Hallazgos.
  - **En modo privado** (navegadores que no permiten guardar borradores) no
    hay borrador. Los avisos lo dicen: salir del recorrido y "Tu sesión
    terminó" avisan que lo capturado **se perderá** (antes decían que quedaba
    guardado). Igual en Hallazgos (crear, iniciar y cerrar).
  - En celular, "Terminar recorrido" y "Cancelar" van lado a lado en la
    barra fija al pie, que ocupa menos alto.
  - **Toda la app:** en pantalla táctil, los botones "Guardar" y "Cancelar"
    al pie de los formularios miden 48 px de alto, como el resto de los
    botones (antes 44 px).
  - Reintentar un registro que se quedó sin respuesta nunca lo duplica: si
    ya había llegado, avisa "Ya se había registrado (recorrido #N)".

### ICS (comportamiento seguro)

- **Sin migraciones, variables, dependencias ni cambios de nginx.** La clave
  de idempotencia usa la tabla `idempotency_key` que ya existe (`POST /ics`
  ya tenía `@Idempotent()`).
- **API:** solo textos (compatibles con la UI anterior).
  - "Registro de ICS #N no encontrado" (antes "Ics with id N not found").
  - Colaboradores de otra planta: "Uno o más colaboradores no pertenecen a la
    planta seleccionada." (antes "Empleado no encontrado en la planta
    seleccionada").
  - Más personas que no cumplen que personas totales: "Las personas que no
    cumplen con el estándar no pueden ser más que las personas totales."
    (mismas palabras que la pantalla).
  - Catálogo de reglas de vida: `POST /rules-of-life/seed` responde
    "Catálogo de reglas de vida cargado." (antes "Seeded successfully"), y los
    endpoints sin implementar de `/rules-of-life` responden su texto en
    español (siguen sin hacer nada; ver `docs/ux-auditoria.md`, sección 5,
    punto 8).
- **UI:**
  - Registro de ICS con borrador local (foto incluida), como "Nuevo
    hallazgo".
  - "Guardar" ya no está deshabilitado: marca de una vez todo lo que falta,
    junto a cada campo. Los errores del API se marcan en su campo.
  - "Personas totales" abre el teclado numérico.
  - En celular, la lista de ICS se ve en tarjetas.
  - Si no cargan las reglas de vida o los colaboradores, se dice en el campo
    con "Reintentar".
- **Para el cliente:**
  - **Lo capturado en un registro de ICS ya no se pierde** si se recarga la
    página, se cierra la app o se pierde la señal. Al volver se ofrece
    "Recuperar" o "Descartar". Vive solo en ese dispositivo y navegador, y
    al cerrar sesión se borra (con aviso), como en Hallazgos.
  - Si un envío se quedó sin respuesta o el servidor falló, el registro
    queda en solo lectura con "Reintentar envío" o "Descartar"; el reintento
    nunca lo duplica. Si ya había llegado: "Ya se había guardado (ICS #N)".
  - "Cancelar" con algo capturado pregunta "¿Salir del registro?". En modo
    privado avisa que lo capturado se perderá.
  - Textos de la pantalla: "Estándar de comportamiento" (con acento) y "Área"
    sin asterisco, porque nunca fueron obligatorios; "Personas que no cumplen
    con el estándar" pasó a "Personas que no cumplen" (en celular se cortaba).
    El aviso de éxito dice "ICS creado correctamente" (antes "Ics…").

### Gemba Walk: salir del recorrido (después de ICS)

- **Solo UI.** Al confirmar "Salir del recorrido" se guarda en ese momento
  lo último capturado. Antes, si se confirmaba menos de ~0.8 s después del
  último cambio, ese cambio no alcanzaba a guardarse en el borrador.

### Dashboards (hallazgos y Análisis de datos EPP)

- **Sin migraciones, variables, dependencias, cambios de nginx ni del API.**
- **UI:**
  - Al entrar se propone la planta: la única del usuario o la última que
    eligió en esa pantalla en ese dispositivo.
  - **Periodo por omisión: los últimos 30 días** en ambos tableros (antes,
    el mes en curso). En EPP hay un atajo nuevo, "Últimos 30 días".
  - Un solo aviso para la pantalla (elegir planta o periodo, sin datos,
    error con "Reintentar") en lugar de uno por gráfica.
  - En celular: los filtros del dashboard ya no quedan fijos arriba, las
    donas muestran cantidades en la leyenda sin cortar nombres y los
    indicadores de EPP van de dos en dos.
- **Para el cliente:**
  - **El dashboard abre con datos de los últimos 30 días** (antes, del día 1
    del mes a hoy). Las cifras de entrada cambian respecto a lo que se veía,
    sobre todo a principio y fin de mes. El informe PDF dice el periodo, como
    siempre; para el mes en curso basta elegir las fechas.
  - En Análisis de datos EPP, la comparación por omisión es contra los 30
    días anteriores (antes, contra los mismos días del mes anterior). "Este
    mes" sigue en la lista de periodos.
  - La planta elegida se recuerda solo en ese navegador; no hay que hacer
    nada en el servidor.
  - Sin hallazgos o entregas en el periodo se ofrece ampliarlo (90 días en
    el dashboard, 3 meses en EPP).

### Panel administrativo

#### Grupo 1: base común y Procesos

- **Sin migraciones, variables, dependencias ni cambios de nginx.**
- **API:** solo un texto. "Proceso #N no encontrado" (antes "Proceso con ID
  N no encontrado"). Compatible con la UI anterior.
- **UI:**
  - Procesos: "Guardar" ya no está deshabilitado y marca de una vez lo que
    falta; "Cancelar" con algo capturado pide confirmar; al editar, se ve
    una carga mientras llega el registro y un aviso si no existe o no cargó.
  - En celular, la lista de procesos se ve en tarjetas.
  - En tablet y escritorio, el formulario muestra la ruta "Configuración ›
    Procesos › …" sobre el título.
- **Para el cliente:** si edita un proceso y no cambia nada, "Cancelar" sale
  directo; si cambió algo, pregunta antes de descartarlo.

#### Grupo 2: General (Usuarios, Colaboradores, Plantas, Lugares y Zonas)

- **Sin migraciones, variables, dependencias ni cambios de nginx.**
- **API:** solo textos (compatibles con la UI anterior).
  - Ids con un solo formato: "Usuario #N no encontrado", "Planta #N no
    encontrada", "Zona #N no encontrada" (antes "con id N" o "con ID N").
  - Catálogos de colaboradores: "Área #N no encontrada", "Puesto #N no
    encontrado", "Género #N no encontrado" (antes "Área con id N no
    encontrado").
  - "Ya existe un colaborador con el código N…" (antes "un empleado").
  - Zonas (`/areas`): "área" y "está" con acento, "Reactívela", y "Área #N no
    encontrada" (antes "Area con ID N no encontrado").
  - `POST /employees/seed` responde "Carga inicial de colaboradores
    completada." (antes "Seed completed successfully2").
- **UI:**
  - Los cinco formularios: "Guardar" marca de una vez lo que falta,
    confirmación al salir con algo capturado, carga y aviso de "no
    encontrado" al editar, y la ruta "Configuración › …" en tablet y
    escritorio.
  - En celular, las listas de colaboradores, plantas, lugares y zonas se ven
    en tarjetas.
- **Para el cliente:**
  - **Usuarios:** el rol se marca si falta (antes "Guardar" se quedaba
    deshabilitado sin decir por qué).
  - **Colaboradores:** el género se marca si falta; el campo se llama
    "Código de colaborador".
  - **Plantas:** la latitud y la longitud se escriben con el teclado normal
    (para poder poner el signo menos) y se revisa que sean números válidos;
    se puede escribir con coma decimal.

#### Grupo 3: Criterios, Tipos de criterios, Equipos de protección, Equipos de emergencia y HDS

- **Sin migraciones, variables, dependencias ni cambios de nginx.**
- **API:** solo textos (compatibles con la UI anterior).
  - "Criterio #N no encontrado", "Tipo de criterio #N no encontrado" (antes
    "Tipo de critero con ID N…") y "Equipo #N no encontrado" (antes "Equipo
    con id N no encontrado.").
  - HDS: "Archivo no encontrado." (antes "File not found"); los endpoints
    sin implementar de `/safety-data-files` responden su texto en español.
  - `POST /equipments/seed` responde "Carga inicial de equipos completada."
    (antes "Equipments seeded successfully").
- **UI:**
  - Criterios, Tipos de criterios y Equipos de emergencia: la base común
    (marcar lo que falta, confirmar al salir, carga en edición y ruta
    "Configuración › …").
  - Equipos de protección: el diálogo abre a pantalla completa en celular,
    con "Guardar" y "Cancelar" al pie, y pregunta antes de cerrarse con algo
    capturado.
  - En celular, las listas de criterios, tipos, equipos de protección,
    equipos de emergencia y HDS se ven en tarjetas.
- **Para el cliente:**
  - **Equipos de emergencia en celular:** cada tarjeta tiene su casilla para
    imprimir el QR, y hay "Seleccionar todos los de esta página" arriba.
  - Frecuencia de entrega, precio y capacidad abren el teclado numérico; el
    precio y la capacidad aceptan coma decimal.
  - En HDS, la columna del botón "Ver archivo" se llama "Acciones" (antes
    "Visualizar archivo").

#### Grupo 4: configuración de Gemba Walk (zonas, observadores, conceptos y calendario)

- **Sin migraciones, variables, dependencias ni cambios de nginx.**
- **API:** solo textos (compatibles con la UI anterior).
  - Ids con "#N" y acentos: "Zona #N no encontrada", "La zona #N está
    inactiva", "Observador #N no encontrado", "Concepto #N no encontrado",
    "Evento #N no encontrado", "Usuario(s) #1, #2 no encontrado(s)", "No se
    pueden editar eventos pasados (#1, #2)" (antes "con ID N", "esta
    inactiva", "(ID 1, 2)").
  - Registro de recorridos: "Planta #N no encontrada", "Evento #N no
    encontrado o inactivo" y "Recorrido #N no encontrado" (antes "con ID
    N").
- **UI:**
  - Zonas, observadores y conceptos: la base común (marcar lo que falta,
    confirmar al salir, carga en edición y la ruta "Configuración › Gemba
    Walk › …").
  - En celular, las listas de zonas, observadores, conceptos y calendario se
    ven en tarjetas.
- **Para el cliente:**
  - Los formularios de observadores y conceptos ya no aparecen en rojo al
    abrirse; lo que falta se marca al tocar "Guardar".
  - El editor del calendario se titula "Programar recorridos" (antes
    "Gemba Walk - Calendario").
  - En la lista del calendario, los eventos pasados dicen "Evento pasado"
    donde antes había un "-".

#### Panel administrativo completo

Con los cuatro grupos, todas las pantallas del panel (Usuarios,
Colaboradores, Plantas, Lugares, Zonas, Procesos, Criterios, Tipos de
criterios, Equipos de protección, Equipos de emergencia, HDS y la
configuración de Gemba Walk) tienen tarjetas en celular, y sus formularios
marcan lo que falta, piden confirmar al salir y muestran la ruta en tablet y
escritorio. Nada de esto requiere cambios en el servidor.

