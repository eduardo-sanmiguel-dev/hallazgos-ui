// Real User Monitoring de OpenObserve: sesiones, errores del navegador, Web
// Vitals, llamadas a la API y grabación de sesiones. El punto de entrada lo carga
// antes de montar React. Solo se activa en
// producción con VITE_OPENOBSERVE_* definidas y fuera de una máquina
// local (además, nginx de logs.comportarte.com solo acepta RUM de
// https://comportarte.com).
import { openobserveLogs } from "@openobserve/browser-logs";
import { openobserveRum } from "@openobserve/browser-rum";

import { useUserSessionStore } from "@store";
import { usePlantSelectionStore } from "@store/plantSelection.store";
import { isBotNavigator, isLocalHostname, shouldSendRumEvent } from "@shared/utils/rum";
import { listenInstallPrompt } from "@shared/utils/installPrompt";
import { syncRumUser } from "@shared/utils/rumUser";

// Botón "Instalar app": el navegador avisa una sola vez al cargar, así que
// se escucha aquí, antes que cualquier componente (en todos los ambientes).
listenInstallPrompt();

const site = import.meta.env.VITE_OPENOBSERVE_SITE;
const clientToken = import.meta.env.VITE_OPENOBSERVE_CLIENT_TOKEN;
const organizationIdentifier = import.meta.env.VITE_OPENOBSERVE_ORG || "default";
const apiOrigin = import.meta.env.VITE_API_ORIGIN;

const common = {
  clientToken: clientToken ?? "",
  site,
  organizationIdentifier,
  service: "ui-comportarte",
  env: "production",
  // La misma versión del build que muestra el menú: permite verificar si
  // un error pertenece a una UI anterior o reapareció después de corregirlo.
  version: import.meta.env.VITE_APP_VERSION,
  apiVersion: "v1",
  insecureHTTP: false,
};

// Bots y navegadores automatizados no se monitorean (ver isBotNavigator).
const isBot = typeof navigator !== "undefined" && isBotNavigator(navigator);
const isLocal = typeof location !== "undefined" && isLocalHostname(location.hostname);

if (import.meta.env.MODE === "production" && site && clientToken && !isBot && !isLocal) {
  // Un fallo del monitoreo nunca debe impedir que la app cargue.
  try {
    openobserveRum.init({
      ...common,
      applicationId: "comportarte-ui",
      sessionSampleRate: 100,
      // Graba todas las sesiones, sin enmascarar textos ni campos.
      sessionReplaySampleRate: 100,
      defaultPrivacyLevel: "allow",
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      beforeSend: shouldSendRumEvent,
      // Enlaza cada llamada a la API con su traza del servidor.
      ...(apiOrigin && {
        allowedTracingUrls: [
          {
            match: (url: string) => url.startsWith(apiOrigin),
            propagatorTypes: ["tracecontext"],
          },
        ],
        traceSampleRate: 100,
      }),
    });

    openobserveRum.startSessionReplayRecording();

    openobserveLogs.init({ ...common, forwardErrorsToLogs: true });

    // También actualiza nombre y correo cuando cambia el perfil del mismo ID.
    syncRumUser(useUserSessionStore, openobserveRum, usePlantSelectionStore);
  } catch (error) {
    console.error("No se pudo iniciar el monitoreo de OpenObserve", error);
  }
}
