// Real User Monitoring de OpenObserve: sesiones, errores del navegador, Web
// Vitals, llamadas a la API y grabación de sesiones. Next carga este archivo
// en el navegador antes de que la app sea interactiva. Solo se activa en
// producción con NEXT_PUBLIC_OPENOBSERVE_* definidas y fuera de una máquina
// local (además, nginx de logs.comportarte.com solo acepta RUM de
// https://comportarte.com).
import { openobserveLogs } from "@openobserve/browser-logs";
import { openobserveRum } from "@openobserve/browser-rum";

import { useUserSessionStore } from "@store";
import {
  isBotNavigator,
  isLocalHostname,
  shouldSendRumEvent,
} from "@shared/utils/rum";
import { listenInstallPrompt } from "@shared/utils/installPrompt";
import { syncRumUser } from "@shared/utils/rumUser";

// Botón "Instalar app": el navegador avisa una sola vez al cargar, así que
// se escucha aquí, antes que cualquier componente (en todos los ambientes).
listenInstallPrompt();

const site = process.env.NEXT_PUBLIC_OPENOBSERVE_SITE;
const clientToken = process.env.NEXT_PUBLIC_OPENOBSERVE_CLIENT_TOKEN;
const organizationIdentifier =
  process.env.NEXT_PUBLIC_OPENOBSERVE_ORG || "default";
const apiOrigin = process.env.NEXT_PUBLIC_URL_API_RAW;

const common = {
  clientToken: clientToken ?? "",
  site,
  organizationIdentifier,
  service: "ui-comportarte",
  env: "production",
  apiVersion: "v1",
  insecureHTTP: false,
};

// Bots y navegadores automatizados no se monitorean (ver isBotNavigator).
const isBot = typeof navigator !== "undefined" && isBotNavigator(navigator);
const isLocal =
  typeof location !== "undefined" && isLocalHostname(location.hostname);

if (
  process.env.NODE_ENV === "production" &&
  site &&
  clientToken &&
  !isBot &&
  !isLocal
) {
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
    syncRumUser(useUserSessionStore, openobserveRum);
  } catch (error) {
    console.error("No se pudo iniciar el monitoreo de OpenObserve", error);
  }
}
