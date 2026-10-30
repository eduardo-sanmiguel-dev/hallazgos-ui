# Recarga automática después de desplegar la UI

Cada `pnpm build` genera un UUID nuevo con `scripts/build.mjs`, incluso si se
repite el mismo commit. Ese ID queda incorporado al bundle del navegador,
al endpoint público `/api/deployment-version` y a `.next/BUILD_ID`.

`DeploymentUpdates`, montado en el layout raíz (incluido el login), mantiene
una conexión con `wss://api.comportarte.com/api/v1/deployments/ws`. La URL se
deriva de `NEXT_PUBLIC_URL_API`, por lo que no hay otro dominio que configurar.
No hay polling de versiones. Solo hay reconexión con espera creciente si se
corta el socket, y reconexión al recuperar Internet o volver a la pestaña.

Cuando llega un ID diferente, el navegador confirma mediante una petición
sin caché que ese ID ya está disponible en la UI y ejecuta
`window.location.reload()`. Un aviso viejo durante el arranque no provoca
recargas en bucle. La recarga es forzada: no espera al guardado de formularios.

## Publicación desde el VPS

GitHub Actions sigue ejecutando `bash ~/scripts/hallazgos-ui.sh`.
`scripts/deploy-production.sh` contiene la copia versionada de ese script.
El script del VPS tiene un respaldo de la versión anterior y añade, después
del health check exitoso, `node scripts/publish-ui-version.mjs`.

El publicador verifica que el endpoint de la UI devuelve el mismo ID que el
build y reemplaza atómicamente el archivo:

`~/.local/state/hallazgos/ui-version.json`

La API observa el directorio con `fs.watch` y distribuye el ID por WebSocket.
El archivo sobrevive a reinicios de PM2, deploys de API y cambios del repositorio.
No se requiere una tabla, secretos nuevos ni un endpoint HTTP de escritura.
Ambos servicios y el deploy deben ejecutarse con el usuario `eduardo`.
`UI_VERSION_FILE` permite cambiar el archivo si se configura igual en ambos.
`UI_URL` permite cambiar la URL local del publicador (por defecto puerto 3000).

La API acepta únicamente el origen configurado en `FRONTEND_URL`, publica
solo el ID de UI y rechaza mensajes del navegador. Nginx ya reenvía los
headers `Upgrade` y `Connection`. La API envía pings de mantenimiento para
evitar el timeout de Nginx; esos pings no consultan versiones.

## Primera activación

1. Subir y desplegar los cambios de API.
2. Subir y desplegar los cambios de UI usando el script actualizado del VPS.
3. Las pestañas abiertas antes de instalar esta funcionalidad necesitan una
   recarga inicial para incorporar el listener. Los deploys siguientes se
   detectan automáticamente.

Un deploy exclusivo de API restablece la conexión y envía el ID vigente de UI;
no recarga si la UI no cambió. Un build que falla no publica ningún ID.
Para revertir una UI ya publicada, desplegar y verificar el build restaurado
y ejecutar el publicador, que también avisa el cambio de vuelta.

## Verificación local

```sh
pnpm typecheck
pnpm lint
pnpm build
pnpm exec playwright test -c playwright.deployment.config.ts
```

Las pruebas aisladas de Playwright no necesitan API, PostgreSQL ni usuarios.
La API incluye pruebas de WebSocket y archivo reales en
`src/deployments/deployment-updates.service.spec.ts`.

La comunicación mediante archivo presupone el VPS actual compartido. Para
varios servidores habría que usar un canal compartido, por ejemplo Redis.
