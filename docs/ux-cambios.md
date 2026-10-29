# Cambios del plan de mejora de UX

Resumen final de las fases 1 a 5: qué cambió en cada módulo, qué quedó
pendiente y qué conviene hacer después. El detalle técnico está en:

- `docs/ux-auditoria.md`: diagnóstico, hallazgos (C1–B3, G1–G9) y su estado.
- `docs/ux-componentes.md`: componentes, hooks y reglas para seguir
  construyendo con lo mismo.
- `docs/despliegue.md`: lista de despliegue y texto para el cliente.

## Por qué

La auditoría (Fase 1) encontró cinco problemas principales en el uso diario:
en celular el estado y las acciones de un hallazgo quedaban fuera de la
pantalla; las fotos de la cámara del navegador salían en baja resolución;
con mala señal se perdía lo capturado; los errores llegaban en inglés y sin
decir qué campo falló; y los botones eran chicos y de bajo contraste para
uso en planta. Los cinco quedaron resueltos.

---

## 1. Base común (toda la app)

- **Tema:** áreas táctiles de 44–48 px solo en pantallas táctiles (el
  escritorio no cambia) y contraste AA: verde oscuro para texto
  (`text.brand`), advertencia e información más oscuros en el tema claro, y
  texto rojo más claro en los temas oscuros. Colores por estatus, riesgo y
  plazo en un solo lugar (`semanticTones.ts`).
- **Componentes compartidos:** `PhotoCapture`, `StatusChip`,
  `ResponsiveTable` (tabla en escritorio, tarjetas en celular),
  `EmptyState` / `ErrorState` / `NoAccessState`, skeletons (`ListSkeleton`,
  `TableSkeleton`, `FormSkeleton`, `DashboardSkeleton`), `FormSection`,
  `FormActions`, `ConfirmDialog` (foco inicial en "Cancelar") y
  `PageBreadcrumbs`.
- **Navegación:** barra inferior en celular con "Nuevo hallazgo" al centro y
  hasta tres accesos según el rol; breadcrumbs en los formularios de
  Configuración (tablet y escritorio).
- **Acceso:** quien entra por URL a una pantalla que su menú no muestra ve
  "No tienes acceso a esta sección" y la página no consulta nada. Las reglas
  son las mismas del menú, sin cambios de permisos.
- **Formularios:** "Guardar" nunca está deshabilitado: al tocarlo marca a la
  vez todo lo que falta, junto a cada campo, y enfoca el primero. Confirmar
  antes de salir con algo capturado, y aviso del navegador al recargar o
  cerrar la pestaña. Teclados por tipo de campo (numérico, decimal, correo,
  web).
- **Carga, vacío y error:** esqueleto en la primera carga de las listas;
  "Sin registros" o "No se pudo cargar" con "Reintentar"; ningún estado dice
  "sin registros" antes de consultar.
- **Borrador local** (IndexedDB, foto incluida) en crear, iniciar y cerrar
  hallazgo, registro de ICS y recorrido de Gemba Walk: se recupera tras
  recargar, cerrar la app o perder la señal; un envío sin respuesta queda en
  solo lectura con "Reintentar envío". Se borra al enviar, a los 7 días o al
  cerrar sesión.
- **Sesión:** "Tu sesión terminó" antes de mandar al login (antes, recarga
  sin aviso o ciclo de recargas con un usuario desactivado).

## 2. Errores del API (Fase 3)

- **Formato único** (`ApiExceptionFilter`): mensaje en español, código
  estable, errores por campo y, en los 500, una referencia (`E-XXXXXX`) que
  se busca en OpenObserve. También los errores de librerías: cuerpo de más de
  100 KB, JSON mal formado, foto de más de 2 MB y subida cortada.
- **En la UI:** título por tipo ("Revisa los datos", "Sin conexión", "Error
  del servidor"…), campos marcados y, sin conexión o con tiempo agotado al
  guardar, "Reintentar" con la misma petición y la misma foto. Las consultas
  que fallan a la vez se agrupan en un solo aviso.
- **Idempotencia:** crear, iniciar, cerrar, cancelar, reasignar y comentar
  hallazgos, ICS, entregas de EPP y recorridos de Gemba Walk aceptan
  `Idempotency-Key`: un reintento nunca duplica el registro ni los correos.
- **Textos:** ids como "#N" y mensajes en español en todos los módulos (antes
  mezclaban "con ID N" e inglés).

## 3. Por módulo

### Hallazgos

- Lista en tarjetas en celular, con estatus, plazo y la acción principal
  (Iniciar o Cerrar) a la vista.
- **Cámara del teléfono** ("Tomar foto") con compresión a 1920 px y ~1 MB;
  la del navegador queda como alternativa. Progreso de subida.
- Iniciar y cerrar a pantalla completa en celular; cerrar pide confirmación.
- Nuevo hallazgo: sin rojo al abrir, texto neutro en la descripción, recuerda
  la última planta y lugar, y "Cargando…" mientras llegan los catálogos.
- Foto obligatoria según la bandera "Requiere evidencia fotográfica" de cada
  clasificación (validada también en el API).
- Prioridad con un solo mapeo en todo el sistema (Inmediato = 2 días).
- Con el servidor caído o sin señal, la lista avisa una vez con "Reintentar"
  (antes repetía la consulta sin parar).

### EPP

- Firma al ancho de la pantalla (casi toda la pantalla en horizontal), sin
  firmas vacías, guardada recortada y ligera; en el Excel, centrada y con su
  proporción.
- Lista en tarjetas en celular con el historial desplegable.
- "Elige una planta" cuando aún no hay planta elegida.

### Inspección de extintores

- Formulario en secciones, "Agregar evaluación" arriba y "Guardar" /
  "Cancelar" al pie; errores del API en la tarjeta de cada evaluación.
- Lista en tarjetas en celular.

### CIAEL

- Cinco secciones (Evento, Colaborador, Lesión, Causas, Responsables); lo
  que depende de la planta o la zona se limpia y avisa al cambiarlas.
- Confirmar antes de descartar lo capturado.

### Gemba Walk

- Recorrido iniciado con borrador: se recupera con su hora de inicio
  original. "Cumple / No cumple" con botones grandes y barra fija con el
  conteo.
- Lista en tarjetas, agenda como lista de la semana en celular, detalle con
  "no encontrado" y "Reintentar".
- Calendario: mantener presionado 350 ms en pantalla táctil.

### ICS

- Borrador local, "Guardar" que marca todo, errores del API por campo y
  teclado numérico. Antes, si el API rechazaba el registro no se avisaba
  nada.

### Dashboards

- Planta propuesta (la única o la última elegida), periodo por omisión de
  los últimos 30 días, un solo aviso para la pantalla y donas legibles en
  celular.

### Panel administrativo

- Las 15 pantallas con tarjetas en celular; sus formularios con la base
  común (marcar lo que falta, confirmar al salir, carga y "no encontrado" al
  editar, breadcrumbs).

### API

- Dos migraciones: `main_type.requires_evidence` y tabla `idempotency_key`.
- Corrección de los avisos por correo de la planta 3 (distinguía
  mayúsculas: llegaban a 1 persona en lugar de 4).
- Dependencias actualizadas (Nest 12.3 y otras) con sus efectos en los
  errores ya corregidos.
- Sin cambios de permisos: las mismas rutas solo para administrador y los
  mismos filtros por planta que antes del plan.

## 4. Verificación (Fase 5)

- Cada flujo de captura con los seis tipos de usuario (Administrador,
  Supervisor, General observador y no observador, solo-EPP y solo-HDS) a 360,
  414 y 1440 px: acceso correcto, sin desplazamiento lateral ni errores.
- Teclado, etiquetas y contraste AA en los tres temas.
- Red lenta y API caído en cada flujo: estados de carga y error, y nada de lo
  capturado se pierde.
- Visibilidad por rol y por planta igual que en producción.
- Pruebas automáticas al cierre: API 1496 unitarias y 228 con base de datos;
  UI 496 pruebas e2e y unitarias, tipos y lint. Las pruebas del API
  con base de datos tienen una app por archivo (la prueba intermitente de
  extintores venía de compartir proceso).

---

## 5. Pendientes

Decisiones o trabajo que quedaron fuera del plan (detalle en
`docs/ux-auditoria.md`, sección 5, y `docs/ux-componentes.md`, sección 13):

| # | Pendiente | Tipo | Quién decide |
| --- | --- | --- | --- |
| 1 | Revisar en el API qué consultas de **lectura** devuelven datos a roles que no deberían verlos (la UI ya bloquea las pantallas) | Seguridad | Equipo |
| 2 | Destinatarios de la planta 3 escritos en el código: moverlos a configuración; confirmar si `strujillo@` y `dspaggiari@` deben tener la planta 3 | Configuración | Cliente y equipo |
| 3 | Endpoints de CIAEL e ICS que no hacen nada (`PATCH`/`DELETE` de CIAEL, `/rules-of-life`, edición de ICS en la UI): quitarlos o implementarlos | Limpieza | Equipo |
| 4 | Tema oscuro: botón rojo relleno ("Descartar", "Eliminar") con texto blanco a 3.68:1 | Contraste | Equipo |
| 5 | ICS: si "Estándar de comportamiento" y "Área" deben ser obligatorios | Negocio | Cliente |
| 6 | Nomenclatura lugar / zona / área distinta entre pantallas | Consistencia | Cliente |
| 7 | Unos 300 hallazgos anteriores al 27-jun-2026 muestran la otra etiqueta de prioridad (se conservaron los días) | Datos | Decidido: se dejan |
| 8 | Borradores de iniciar o cerrar de un hallazgo que cambió de estado en otro dispositivo: no se pueden abrir; se borran a los 7 días | UX menor | Equipo |
| 9 | Extintores y CIAEL sin idempotencia: sin conexión al guardar se vuelve a tocar "Guardar" (sin "Reintentar") | UX menor | Equipo |
| 10 | Scripts del servidor con `pnpm install` sin `--frozen-lockfile` | Despliegue | Equipo |

## 6. Recomendaciones a futuro

1. **Medir después del despliegue** (2 a 4 semanas):
   - Resolución y peso de las fotos nuevas (la misma consulta de la
     auditoría): confirma que la cámara del teléfono resolvió C2.
   - Reintentos y envíos recuperados: filas de `idempotency_key` y respuestas
     con `Idempotent-Replayed` (cuántas veces evitó un duplicado).
   - Errores 500 y avisos de "Sin conexión" en OpenObserve por pantalla.
2. **Cola sin conexión (opción B de la auditoría)** solo si las métricas
   muestran zonas de planta sin señal: el borrador local ya cubre la mala
   señal al guardar.
3. **Pruebas e2e en CI:** hoy CI de la UI solo corre tipos y lint; las e2e
   corren antes de cada push en local (`.husky/pre-push`). Conviene correrlas
   en GitHub Actions con un API y una base temporales, como las pruebas de
   base de datos del API, e incluir un proyecto de celular (360 px).
4. **Accesibilidad automática:** agregar `@axe-core/playwright` (librería
   nueva, requiere aprobación) para revisar contraste y etiquetas en cada
   prueba; la verificación de la Fase 5 se hizo con revisiones propias.
5. **Seguir con los componentes base** en pantallas nuevas (ver
   `docs/ux-componentes.md`): `ResponsiveTable`, `useFormFieldErrors` con
   `failAll`, `useLeaveConfirm`, `useFormDraft` para formularios de campo, y
   `@Idempotent()` en todo `POST` que cree registros o mande correos.
6. **Recordar la planta en EPP**, como en los dashboards, para usuarios con
   varias plantas (hoy hay que elegirla cada vez).
