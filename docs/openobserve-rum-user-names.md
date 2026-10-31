# Nombres en la tabla de sesiones de OpenObserve

La instalación del VPS usa OpenObserve Enterprise v1.1.2. El SDK ya envía
`usr_name`, `usr_email` y `usr_id`, pero `AppSessions` solo agrega y muestra
`usr_email`. No hace falta cambiar la API ni reescribir datos históricos.

El script `scripts/openobserve-rum-user-names.py` prepara una copia del bundle
de esa vista con cuatro ajustes: consultar `usr_name`, conservarlo en las filas,
mostrarlo con respaldo al correo y ordenar por el nombre mostrado. Los filtros
por correo y los datos originales se conservan.

## Preparar en el VPS

```bash
python3 ~/openobserve/openobserve-rum-user-names.py \
  --output ~/openobserve/rum-user-names
```

El script descarga los assets del contenedor por localhost, valida cada
reemplazo y genera el bundle, su original, hashes y `nginx-location.conf`.
No necesita la cuenta de servicio.

## Aplicar con acceso administrativo

1. Respaldar `/etc/nginx/sites-available/logs.conf` (verificar antes el destino
   del enlace `/etc/nginx/sites-enabled/logs.conf`).
2. Crear `/var/lib/openobserve-ui-overrides`, copiar ahí el `.js` generado y
   dejarlo legible por nginx (directorio 755, archivo 644).
3. Copiar `nginx-location.conf` a
   `/etc/nginx/snippets/openobserve-rum-user-names.conf` e incluirlo dentro del
   bloque HTTPS de `logs.conf`:

   ```nginx
   include /etc/nginx/snippets/openobserve-rum-user-names.conf;
   ```

4. Ejecutar `sudo nginx -t` y, si pasa, `sudo systemctl reload nginx`.
5. Comprobar que el SHA-256 del asset público coincide con `patched_sha256`
   del manifiesto. Recargar OpenObserve con Ctrl+Shift+R y verificar sesiones.

No se reinicia PM2 ni OpenObserve. El override vive fuera del contenedor y
solo afecta al asset exacto de esta versión. Al actualizar OpenObserve puede
dejar de aplicarse: revisar si la nueva versión ya muestra el nombre; el script
rechaza bundles con estructura distinta. Quitar el include y recargar nginx
revierte el cambio. Las sesiones anónimas conservan su etiqueta habitual.

La UI también sincroniza cambios de nombre y correo aunque el ID siga igual;
ese cambio local entra en producción después del push y deploy habituales.

## Estado aplicado el 31 de octubre de 2026

El override está activo en `https://logs.comportarte.com`. Se comprobó HTTP 200,
tipo JavaScript y coincidencia del SHA-256 público con el bundle corregido:
`eb168dc71846779b7888f819ba4baad115ca9ac3695edacbd483bd121ee27244`.

El instalador `scripts/install-openobserve-rum-user-names.py` se copió como
`/usr/local/sbin/openobserve-rum-user-names`, propiedad de root. Valida el hash,
respalda nginx, instala el asset y el include, comprueba la configuración y
recarga nginx. Ante un fallo de comprobación o recarga restaura la configuración.

Respaldo creado:
`/etc/nginx/sites-available/logs.conf.before-rum-names-1793457980211584535`.

El permiso `/etc/sudoers.d/openobserve-rum-temporal` fue eliminado al terminar;
se verificó que el instalador ya no puede ejecutarse con sudo sin contraseña.
OpenObserve respondió `{"status":"ok"}` después de la recarga.

No se modificó el código desplegado de la UI ni la API en el VPS. El cambio de
sincronización de identidad permanece local, pendiente del push del propietario.
