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

No hay variables de entorno ni dependencias nuevas: los `.env.production` del
servidor ya tienen todas las que pide el API (`joi.validarion.ts`).

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
